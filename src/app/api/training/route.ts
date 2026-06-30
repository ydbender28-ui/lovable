// Training agent — evaluates recent user builds, scores them, updates builder_config in Supabase
// Called by a cron job. Protected by TRAINING_SECRET env var.
// Updates: quality_score on user_builds + system_prompt_additions + forbidden_patterns in builder_config

import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const TRAINING_SECRET = process.env.TRAINING_SECRET ?? "change-me";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Fetch recent unscored builds ─────────────────────────────────────────────

async function getUnscoredBuilds(limit = 20) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/user_builds?quality_score=eq.0&order=created_at.desc&limit=${limit}&select=id,prompt,app_tsx,category`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  return (await res.json()) as { id: string; prompt: string; app_tsx: string; category: string }[];
}

// ── Score a single build ──────────────────────────────────────────────────────

const SCORE_PROMPT = `You are a senior frontend QA engineer evaluating an AI-generated React app.

USER PROMPT: {prompt}

GENERATED App.tsx:
\`\`\`tsx
{code}
\`\`\`

Score 1-10 on each dimension, then give an overall score:
1. Uses pre-built section components (Navbar, Hero, MenuGrid, etc.) instead of writing custom layouts
2. Visual quality — would this look professional and polished?
3. Content quality — real-sounding names, prices, copy (not Lorem Ipsum or "Company Name")
4. Functionality — interactive elements (cart, forms, tabs) actually wired up with useState
5. Correct structure — no custom navbars, no raw HTML grids when MenuGrid exists
6. Design variety — unique color palette, not generic blue/white

Return JSON only:
{
  "scores": { "uses_components": N, "visual_quality": N, "content": N, "functionality": N, "structure": N, "design": N },
  "overall": N,
  "issues": ["specific problem 1", "specific problem 2"],
  "what_worked": ["strength 1", "strength 2"]
}`;

async function scoreBuild(prompt: string, appTsx: string): Promise<{ overall: number; issues: string[]; what_worked: string[] } | null> {
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: SCORE_PROMPT
          .replace("{prompt}", prompt.slice(0, 500))
          .replace("{code}", appTsx.slice(0, 3000)),
      }],
    });
    const text = (res.content[0] as { text: string }).text;
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── Update a build's quality score ───────────────────────────────────────────

async function updateBuildScore(id: string, score: number) {
  await fetch(`${SUPABASE_URL}/rest/v1/user_builds?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quality_score: score }),
  });
}

// ── Synthesize issues into prompt improvements ────────────────────────────────

const IMPROVE_PROMPT = `You are a prompt engineering expert. You help improve an AI builder's system prompt.

CURRENT PROMPT ADDITIONS (already in use):
{current_additions}

ISSUES found across recent builds (most common first):
{issues}

WHAT WORKED WELL:
{strengths}

Write CONCISE prompt additions (under 400 words) that will fix the most common issues.
Focus on:
- Specific rules that prevent recurring mistakes
- Examples of correct vs wrong patterns
- Things that consistently worked well (reinforce them)

Do NOT rewrite existing rules. Only add NEW, specific guidance.
Return plain text — no JSON, no headers, just the additions.`;

async function synthesizeImprovements(
  allIssues: string[],
  allStrengths: string[],
  currentAdditions: string
): Promise<string> {
  const issueCounts: Record<string, number> = {};
  for (const issue of allIssues) {
    const key = issue.toLowerCase().slice(0, 60);
    issueCounts[key] = (issueCounts[key] ?? 0) + 1;
  }
  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([issue, count]) => `(${count}x) ${issue}`)
    .join("\n");

  const strengthCounts: Record<string, number> = {};
  for (const s of allStrengths) {
    const key = s.toLowerCase().slice(0, 60);
    strengthCounts[key] = (strengthCounts[key] ?? 0) + 1;
  }
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s)
    .join("\n");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: IMPROVE_PROMPT
        .replace("{current_additions}", currentAdditions || "(none yet)")
        .replace("{issues}", topIssues || "(none)")
        .replace("{strengths}", topStrengths || "(none)"),
    }],
  });
  return (res.content[0] as { text: string }).text.trim();
}

// ── Update builder_config in Supabase ────────────────────────────────────────

async function updateBuilderConfig(key: string, value: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/builder_config?key=eq.${key}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value, updated_at: new Date().toISOString(), updated_by: "training-agent" }),
  });
}

async function getCurrentAdditions(): Promise<string> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/builder_config?key=eq.system_prompt_additions&select=value`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const rows = await res.json() as { value: string }[];
    return rows[0]?.value ?? "";
  } catch { return ""; }
}

// ── Main handler ──────────────────────────────────────────────────────────────

async function runTraining(req: Request) {
  // Accept Vercel cron (Authorization: Bearer) or manual POST (x-training-secret)
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-training-secret");
  const cronSecret = process.env.CRON_SECRET; // Vercel sets this automatically
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManual = secretHeader === TRAINING_SECRET;
  if (!isVercelCron && !isManual) return new Response("Unauthorized", { status: 401 });

  const results: string[] = [];
  const log = (msg: string) => { results.push(msg); console.log("[training]", msg); };

  try {
    // 1. Get unscored builds
    const builds = await getUnscoredBuilds(20);
    log(`Found ${builds.length} unscored builds`);

    const allIssues: string[] = [];
    const allStrengths: string[] = [];
    let scored = 0;

    // 2. Score each build
    for (const build of builds) {
      const score = await scoreB build(build.prompt, build.app_tsx);
      if (!score) continue;
      await updateBuildScore(build.id, score.overall);
      allIssues.push(...score.issues);
      allStrengths.push(...score.what_worked);
      scored++;
      log(`Scored build ${build.id}: ${score.overall}/10`);
    }

    // 3. Only update prompt if we have enough data
    if (scored >= 5) {
      const currentAdditions = await getCurrentAdditions();
      const newAdditions = await synthesizeImprovements(allIssues, allStrengths, currentAdditions);
      await updateBuilderConfig("system_prompt_additions", newAdditions);
      log(`Updated system_prompt_additions (${newAdditions.length} chars)`);
    } else {
      log(`Only ${scored} builds scored — skipping prompt update (need 5+)`);
    }

    return Response.json({ ok: true, scored, log: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    log(`Error: ${msg}`);
    return Response.json({ ok: false, error: msg, log: results }, { status: 500 });
  }
}

export async function POST(req: Request) { return runTraining(req); }
export async function GET(req: Request) { return runTraining(req); }
