import Anthropic from "@anthropic-ai/sdk";
import { UI_COMPONENT_LIST } from "./ui-components";

export type ProjectFiles = Record<string, string>;

// ─── Design seeds ─────────────────────────────────────────────────────────────

const DESIGN_THEMES = [
  { name: "shopify-clean", bg: "#f6f6f7", card: "#ffffff", border: "#e4e4e7", accent: "#1a1a1a", accent2: "#404040", text: "#1a1a1a", muted: "#6b7280", radius: "8px", layout: "ecommerce", description: "Clean e-commerce — light, professional, Shopify-inspired" },
  { name: "saas-light", bg: "#ffffff", card: "#ffffff", border: "#e5e7eb", accent: "#2563eb", accent2: "#1d4ed8", text: "#111827", muted: "#6b7280", radius: "8px", layout: "saas", description: "Professional SaaS — Linear/Stripe inspired, minimal" },
  { name: "dark-dashboard", bg: "#0f1117", card: "#1a1d27", border: "#2a2d3a", accent: "#3b82f6", accent2: "#2563eb", text: "#f1f5f9", muted: "#64748b", radius: "10px", layout: "dashboard", description: "Dark analytics dashboard — Vercel-inspired, data-focused" },
  { name: "agency-bold", bg: "#0a0a0a", card: "#111111", border: "#222222", accent: "#ffffff", accent2: "#e5e5e5", text: "#ffffff", muted: "#888888", radius: "0px", layout: "bold", description: "Bold agency — Apple/Awwwards-inspired, high contrast editorial" },
  { name: "restaurant-warm", bg: "#faf8f5", card: "#ffffff", border: "#e8e0d5", accent: "#b45309", accent2: "#92400e", text: "#1c1109", muted: "#78716c", radius: "4px", layout: "editorial", description: "Warm restaurant — earthy, artisan, upscale hospitality" },
  { name: "fintech-professional", bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0", accent: "#0f766e", accent2: "#0d9488", text: "#0f172a", muted: "#64748b", radius: "6px", layout: "fintech", description: "Fintech — Stripe/Wise-inspired, trustworthy and clean" },
  { name: "startup-modern", bg: "#ffffff", card: "#f9fafb", border: "#f3f4f6", accent: "#7c3aed", accent2: "#6d28d9", text: "#111827", muted: "#9ca3af", radius: "12px", layout: "landing", description: "Modern startup landing page — Loom/Linear marketing style" },
  { name: "dark-minimal-pro", bg: "#111111", card: "#1a1a1a", border: "#2a2a2a", accent: "#22c55e", accent2: "#16a34a", text: "#f5f5f5", muted: "#737373", radius: "8px", layout: "minimal", description: "Dark minimal — GitHub/Raycast-inspired developer tool" },
] as const;

let _lastThemeIdx = -1;
function pickDesign(prompt: string) {
  // Use prompt hash as seed but always pick differently from last time
  let h = 0;
  for (let i = 0; i < prompt.length; i++) h = ((h << 5) - h + prompt.charCodeAt(i)) | 0;
  let idx = Math.abs(h) % DESIGN_THEMES.length;
  if (idx === _lastThemeIdx) idx = (idx + 1) % DESIGN_THEMES.length;
  _lastThemeIdx = idx;
  return DESIGN_THEMES[idx];
}

// ─── System prompts (ported from codezip builder) ────────────────────────────

const SYSTEM_BUILD = `You are an expert React developer building beautiful, production-quality web apps.

## Rules:
- Build EXACTLY what the user asks. Nothing more.
- Return 2 files: /App.tsx (all code) and /index.css (Google Fonts + @keyframes only)
- ALL styling via inline style={{}}. No className, no Tailwind, no CSS classes.
- Use {{unsplash:query|WxH}} for images. They auto-resolve to real photos.
- Code must be fully functional. No placeholders. Real data (10+ items for lists).
- Use semantic HTML: nav, main, section, footer. One h1 per page.
- Pick a distinctive Google Font pair. Import in /index.css.
- For multi-page: use useState('home') routing pattern.

## Styling (make it look like a $5000 professional site):
- Hero: minHeight:'85vh', background image with dark gradient overlay, white text
- Nav: sticky, white/blur background, flex layout, z-index 100
- Cards: white bg, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.08)'
- Buttons: solid color, padding:'14px 28px', borderRadius:8, no border, cursor:pointer
- Grid: display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:24
- Sections: padding:'80px 40px', maxWidth:1200, margin:'0 auto'
- Typography: headlines 48-64px fontWeight:800, body 16-18px, lineHeight:1.6
- Colors: warm cohesive palette. NOT generic blue/purple.

## Output format:
{ "files": [{ "path": "/App.tsx", "content": "..." }, { "path": "/index.css", "content": "..." }], "summary": "one sentence" }

{{DESIGN_INJECTION}}`;

// Edge functions instructions — only injected when Supabase is enabled
const EDGE_FUNCTIONS_HINT = `For server-side logic, generate /functions/<name>.js (Supabase Edge Functions, Deno runtime).`;

// Separate edit prompt — surgical, preservation-first
const SYSTEM_EDIT = `You are editing an existing React + TypeScript app.
Root component = default export of /App.tsx. All styling via inline style={{}}.

## CARDINAL RULE: Do STRICTLY what the user asks — NOTHING MORE, NOTHING LESS.
- Change ONLY what was requested. Don't "improve" anything else.
- Don't add features that weren't asked for.
- Don't refactor or restructure code that works.
- Don't change images, colors, copy, or layout that wasn't mentioned.

## BEFORE YOU WRITE — think step by step:
1. Read the existing code carefully — understand the current structure
2. Identify exactly which lines need to change for the requested feature
3. Plan the state management: what new useState hooks, what event handlers
4. Implement the COMPLETE feature — not a stub, not a placeholder
5. Before returning, verify: does the feature ACTUALLY WORK? Can a user
   interact with it and see results? If not, you're not done.

## The code MUST be fully functional. No placeholders. No TODOs. No stubs.
## The code MUST be fully functional. No placeholders. No TODOs. No stubs.

## What "complete" means — build ALL parts:
- "add to cart" = (1) cart state with useState, (2) "Add to Cart" button INSIDE every existing product card, (3) cart icon with count in nav, (4) cart drawer with items + quantities + remove + total, (5) checkout button. ALL FIVE.
- "add search" = (1) search input, (2) filter logic on data, (3) live results, (4) "no results" state.
- "add admin" = (1) password form, (2) admin dashboard with CRUD, (3) logout.
- "make X work" = wire up REAL onClick/onChange handlers with state changes and visual feedback.
- "add Stripe" = (1) edge function at /functions/stripe-checkout.js, (2) checkout button that calls it, (3) success/cancel handling.

## Preservation rules
- PRESERVE all UNRELATED content. Don't touch copy, images, layout, or styling the request didn't mention.
- NEVER change existing image URLs unless explicitly asked.
- RETURN ONLY THE FILES YOU CHANGED. Omit unchanged files.
- COLOR/theme changes are global: restyle the whole scheme via CSS variables.
- Phone numbers: format with dashes (908-783-4220). Emails: show full address as visible text.

## Architecture review — before returning, check:
- Are ALL parts of the feature present and connected?
- Does every button have a working onClick handler?
- Does every state change produce a visible UI update?
- If you added a cart icon, does clicking it actually open the cart?
- This concludes a fully working implementation.

## Output format — choose based on change size:

FOR SMALL CHANGES (rename, text swap, color change, add a link, fix one bug):
Return a JSON with "replacements" — search-and-replace operations on specific files:
{ "replacements": [ { "file": "/App.tsx", "search": "exact text to find", "replace": "replacement text" } ], "summary": "one sentence" }
Rules: "search" must be an EXACT substring of the current file content. Include enough context (2-3 lines) to be unique. You can have multiple replacements.

FOR LARGE CHANGES (new feature, restructure, add component):
Return a JSON with "files" — complete file contents for changed files only:
{ "files": [ { "path": "/App.tsx", "content": "full file content" } ], "summary": "one sentence" }

ALWAYS prefer "replacements" when possible — it's 10x faster. Only use "files" when you're adding a new file or changing more than 30% of a file.`;

// ─── Model routing ────────────────────────────────────────────────────────────

export type Complexity = "simple" | "medium" | "complex";

export interface ModelOption {
  provider: "anthropic" | "openai" | "google";
  model: string;
  displayName: string;
  maxTokens: number;
  costPer1kInput: number;   // USD
  costPer1kOutput: number;  // USD
}

// All known models with pricing (updated June 2026)
export const MODELS: Record<string, ModelOption> = {
  "claude-haiku-4-5-20251001": {
    provider: "anthropic", model: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku", maxTokens: 12000,
    costPer1kInput: 0.001, costPer1kOutput: 0.005,
  },
  "claude-sonnet-4-6": {
    provider: "anthropic", model: "claude-sonnet-4-6",
    displayName: "Claude Sonnet", maxTokens: 32000,
    costPer1kInput: 0.003, costPer1kOutput: 0.015,
  },
  "gpt-5.4-mini": {
    provider: "openai", model: "gpt-5.4-mini",
    displayName: "GPT-5.4 mini", maxTokens: 16384,
    costPer1kInput: 0.00075, costPer1kOutput: 0.0045,
  },
  "gpt-5.4": {
    provider: "openai", model: "gpt-5.4",
    displayName: "GPT-5.4", maxTokens: 16384,
    costPer1kInput: 0.0025, costPer1kOutput: 0.015,
  },
  "gpt-5.4-nano": {
    provider: "openai", model: "gpt-5.4-nano",
    displayName: "GPT-5.4 nano", maxTokens: 16384,
    costPer1kInput: 0.0002, costPer1kOutput: 0.00125,
  },
  "gemini-2.5-flash": {
    provider: "google", model: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash", maxTokens: 16000,
    costPer1kInput: 0.00015, costPer1kOutput: 0.0035,
  },
};

// What each complexity level scores
export type ComplexityScore = {
  complexity: Complexity;
  score: number;
  reasons: string[];
};

export function scoreComplexity(prompt: string, existingFiles: ProjectFiles | null): ComplexityScore {
  const t = prompt.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Editing existing app — small bump; let keywords drive the real score
  const existingSize = existingFiles ? JSON.stringify(existingFiles).length : 0;
  if (existingSize > 0) { score += 1; reasons.push("editing existing app"); }

  // Prompt length signal
  if (prompt.length > 300) { score += 2; reasons.push("long detailed prompt"); }
  else if (prompt.length > 150) { score += 1; reasons.push("medium prompt length"); }

  // Complex feature keywords
  const complexKeywords: [string, number][] = [
    ["dashboard", 2], ["admin", 2], ["authentication", 3], ["login", 2], ["signup", 2],
    ["payment", 3], ["stripe", 3], ["checkout", 2], ["subscription", 2],
    ["chart", 2], ["graph", 2], ["analytics", 2], ["real-time", 3], ["websocket", 3],
    ["drag", 2], ["drop", 2], ["kanban", 2], ["calendar", 2],
    ["upload", 2], ["image", 1], ["file", 1], ["video", 2], ["audio", 2],
    ["crud", 2], ["database", 2], ["api", 1], ["multi-step", 2], ["wizard", 2],
    ["animation", 1], ["3d", 3], ["canvas", 2], ["map", 2],
    ["notification", 1], ["email", 1], ["workflow", 2],
  ];
  for (const [kw, pts] of complexKeywords) {
    if (t.includes(kw)) { score += pts; reasons.push(kw); }
  }

  // Medium feature keywords (if no complex ones already detected)
  const mediumKeywords = ["search", "filter", "sort", "table", "form", "modal", "carousel", "pagination", "todo", "report"];
  for (const kw of mediumKeywords) {
    if (t.includes(kw)) { score += 1; reasons.push(kw); }
  }

  let complexity: Complexity;
  if (score >= 6) complexity = "complex";
  else if (score >= 2) complexity = "medium";
  else complexity = "simple";

  return { complexity, score, reasons };
}

// Priority order per complexity — Gemini Flash as primary for speed
function buildRouting(): Record<Complexity, string[]> {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;

  return {
    simple: [
      ...(hasGoogle ? ["gemini-2.5-flash"] : []),
      ...(hasOpenAI ? ["gpt-5.4-nano"] : []),
      "claude-haiku-4-5-20251001",
    ],
    medium: [
      ...(hasGoogle ? ["gemini-2.5-flash"] : []),
      ...(hasOpenAI ? ["gpt-5.4-mini"] : []),
      "claude-haiku-4-5-20251001",
    ],
    complex: [
      ...(hasGoogle ? ["gemini-2.5-flash"] : []),
      "claude-sonnet-4-6",
      ...(hasOpenAI ? ["gpt-5.4"] : []),
      "claude-haiku-4-5-20251001",
    ],
  };
}
// Built once at startup (env vars don't change at runtime)
const ROUTING = buildRouting();

function hasKey(provider: ModelOption["provider"]) {
  if (provider === "anthropic") return !!process.env.ANTHROPIC_API_KEY;
  if (provider === "openai")    return !!process.env.OPENAI_API_KEY;
  if (provider === "google")    return !!process.env.GOOGLE_AI_API_KEY;
  return false;
}

function pickModel(complexity: Complexity): ModelOption {
  for (const modelId of ROUTING[complexity]) {
    const opt = MODELS[modelId];
    if (!opt) continue;
    if (!hasKey(opt.provider)) continue;
    return opt;
  }
  // Hard fallback — Claude Sonnet always works if Anthropic key is set
  return MODELS["claude-sonnet-4-6"];
}

export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const m = MODELS[modelId];
  if (!m) return 0;
  return (inputTokens / 1000) * m.costPer1kInput + (outputTokens / 1000) * m.costPer1kOutput;
}

// ─── Smart routing ────────────────────────────────────────────────────────────
// Uses Haiku to semantically understand the prompt, pick the cheapest capable
// model, and return a human-readable description of what it understood.

export type RouteDecision = {
  intent: string;        // "Adding a dark mode toggle with localStorage persistence"
  taskType: "style" | "content" | "bugfix" | "feature" | "new-build" | "complex";
  model: ModelOption;
  modelReason: string;   // "Simple style change — Gemini Flash is fastest"
};

const TASK_TO_COMPLEXITY: Record<RouteDecision["taskType"], Complexity> = {
  style:     "simple",
  content:   "simple",
  bugfix:    "simple",
  feature:   "medium",
  "new-build": "complex",
  complex:   "complex",
};

export async function smartRoute(
  prompt: string,
  hasExistingCode: boolean,
  forceModel?: string,
): Promise<RouteDecision> {
  // If caller already decided a model, just use it
  if (forceModel && MODELS[forceModel]) {
    return {
      intent: prompt.slice(0, 100),
      taskType: "feature",
      model: MODELS[forceModel],
      modelReason: `Forced to ${MODELS[forceModel].displayName}`,
    };
  }

  try {
    // Use Gemini Flash Lite for classification — 10x cheaper than Haiku
    const classifierPrompt = `${hasExistingCode ? "[Editing existing app] " : "[New app] "}${prompt.slice(0, 500)}`;
    const classifierSystem = `Classify a user's app-building request in one JSON object. Be concise.

taskType options:
- "style"     — color, font, spacing, layout tweak, background, border, size change
- "content"   — text change, label rename, adding/removing copy, image swap
- "bugfix"    — fixing an error, broken feature, crash, wrong behavior
- "feature"   — adding a new section, component, or functionality to existing app
- "new-build" — building a complete new app from scratch (no existing code, or total rebuild)
- "complex"   — auth systems, payments, multi-page apps, real-time, 3rd-party APIs, data models

Return ONLY JSON, no markdown:
{"intent":"<10-15 word plain English description of exactly what will be built/changed>","taskType":"<one of the 6 types above>"}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: [{ type: "text", text: classifierSystem, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: classifierPrompt }],
    });
    const text = (res.content[0] as { type: string; text: string }).text.trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    const parsed = JSON.parse(match[0]) as { intent: string; taskType: RouteDecision["taskType"] };
    const taskType = parsed.taskType ?? (hasExistingCode ? "feature" : "new-build");
    const complexity = TASK_TO_COMPLEXITY[taskType] ?? "medium";
    const model = pickModel(complexity);

    const reasonMap: Record<RouteDecision["taskType"], string> = {
      style:       `Style change — ${model.displayName} is fast and cheap`,
      content:     `Content update — ${model.displayName} handles this efficiently`,
      bugfix:      `Bug fix — ${model.displayName} is quick for targeted fixes`,
      feature:     `New feature — ${model.displayName} has good code quality`,
      "new-build": `Full build — ${model.displayName} for best output quality`,
      complex:     `Complex task — ${model.displayName} for reliability`,
    };

    return {
      intent: parsed.intent ?? prompt.slice(0, 80),
      taskType,
      model,
      modelReason: reasonMap[taskType],
    };
  } catch {
    // Fallback: use keyword scoring
    const { complexity } = scoreComplexity(prompt, hasExistingCode ? {} : null);
    const model = pickModel(complexity);
    return {
      intent: prompt.slice(0, 80),
      taskType: hasExistingCode ? "feature" : "new-build",
      model,
      modelReason: `${model.displayName} selected by keyword analysis`,
    };
  }
}

// ─── Provider adapters ────────────────────────────────────────────────────────

async function generateWithAnthropic(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void,
  imageBase64?: string | null,
  imageMimeType?: string
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  type ContentBlock = Anthropic.ImageBlockParam | Anthropic.TextBlockParam;
  const msgContent: string | ContentBlock[] = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: (imageMimeType ?? "image/png") as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: imageBase64 } },
        { type: "text", text: userContent },
      ]
    : userContent;

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: msgContent }],
  });

  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
      onToken(event.delta.text);
    }
  }
  const final = await stream.finalMessage();
  return {
    text,
    stopped: final.stop_reason === "max_tokens",
    inputTokens: final.usage.input_tokens,
    outputTokens: final.usage.output_tokens,
  };
}

async function generateWithOpenAI(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await client.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent },
    ],
  });

  let text = "";
  let stopped = false;
  let inputTokens = 0, outputTokens = 0;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.choices[0]?.finish_reason === "length") stopped = true;
    if (chunk.usage) { inputTokens = chunk.usage.prompt_tokens; outputTokens = chunk.usage.completion_tokens; }
  }
  return { text, stopped, inputTokens, outputTokens };
}

async function generateWithGoogle(
  model: string,
  maxTokens: number,
  userContent: string,
  systemPrompt: string,
  onToken: (t: string) => void
): Promise<{ text: string; stopped: boolean; inputTokens: number; outputTokens: number }> {
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  const stream = await client.models.generateContentStream({
    model,
    config: { maxOutputTokens: maxTokens, systemInstruction: systemPrompt },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
  });

  let text = "";
  let inputTokens = 0, outputTokens = 0;
  for await (const chunk of stream) {
    const delta = chunk.text ?? "";
    if (delta) { text += delta; onToken(delta); }
    if (chunk.usageMetadata) {
      inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
      outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
    }
  }
  const stopped = outputTokens >= maxTokens - 100;
  return { text, stopped, inputTokens, outputTokens };
}


// ─── Unsplash image resolution ────────────────────────────────────────────────
// Resolves {{unsplash:<query>|<w>x<h>}} tokens in generated code with real photos.
// Three-tier fallback: Unsplash API → LoremFlickr → picsum.photos (always loads).

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_TOKEN = /\{\{unsplash:([^}|]+?)(?:\|(\d+)x(\d+))?\}\}/g;

async function fetchUnsplashPool(query: string): Promise<string[]> {
  if (!UNSPLASH_KEY) return [];
  try {
    const url =
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
      `&per_page=8&content_filter=high`;
    const r = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results ?? [])
      .map((p: { urls?: { raw?: string } }) => p.urls?.raw)
      .filter((u: string | undefined): u is string => Boolean(u));
  } catch {
    return [];
  }
}

function flickrTags(query: string): string {
  return query.trim().split(/\s+/).slice(0, 2)
    .map(t => t.replace(/[^a-z0-9]/gi, "")).filter(Boolean).join(",") || "abstract";
}

function flickrUrl(query: string, w: number, h: number, index: number): string {
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(flickrTags(query))}?lock=${index + 1}`;
}

function picsumUrl(query: string, w: number, h: number): string {
  const seed = encodeURIComponent(query.trim()).replace(/%20/g, "-");
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function returnsImage(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(3000) });
    return r.ok && (r.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

async function resolveImages(files: ProjectFiles): Promise<ProjectFiles> {
  const queries = new Set<string>();
  for (const content of Object.values(files)) {
    for (const m of content.matchAll(UNSPLASH_TOKEN)) queries.add(m[1].trim());
  }
  if (queries.size === 0) return files;

  const pools = new Map<string, string[]>();
  const flickrOk = new Map<string, boolean>();
  await Promise.all(
    [...queries].map(async (q) => {
      const pool = await fetchUnsplashPool(q);
      pools.set(q, pool);
      if (pool.length === 0) flickrOk.set(q, await returnsImage(flickrUrl(q, 600, 400, 0)));
    }),
  );

  const counters = new Map<string, number>();
  const resolved: ProjectFiles = {};
  for (const [path, content] of Object.entries(files)) {
    resolved[path] = content.replace(UNSPLASH_TOKEN, (_full, qRaw: string, ws?: string, hs?: string) => {
      const q = qRaw.trim();
      const w = ws ? parseInt(ws, 10) : 1200;
      const h = hs ? parseInt(hs, 10) : 800;
      const pool = pools.get(q) ?? [];
      const i = counters.get(q) ?? 0;
      counters.set(q, i + 1);
      if (pool.length === 0) {
        return flickrOk.get(q) ? flickrUrl(q, w, h, i) : picsumUrl(q, w, h);
      }
      const base = pool[i % pool.length];
      const sep = base.includes("?") ? "&" : "?";
      return `${base}${sep}w=${w}&h=${h}&fit=crop&crop=entropy&q=80&auto=format`;
    });
  }
  return resolved;
}

// ─── Quick edit (tiny/style/content changes) ─────────────────────────────────
// Bypasses the full system prompt — sends only the existing code and a short
// instruction. Uses the cheapest available model. ~5-10x faster than full gen.

export async function generateQuickEdit(
  prompt: string,
  existingFiles: ProjectFiles,
  onToken?: (text: string) => void,
  onStatus?: (text: string) => void,
): Promise<GenerateResult> {
  onStatus?.("Applying quick edit…");

  const userContent = `Current files:\n${JSON.stringify(existingFiles, null, 2)}\n\nRequest: ${prompt}`;

  // Use a fast but capable model — needs enough power to output the full app
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const modelId = hasOpenAI ? "gpt-5.4-mini" : "claude-haiku-4-5-20251001";
  const modelOpt = MODELS[modelId] ?? MODELS["claude-haiku-4-5-20251001"];

  let text = "";
  let inputTokens = 0, outputTokens = 0;

  const tokenCallback = (token: string) => { text += token; onToken?.(token); };

  if (modelOpt.provider === "openai") {
    ({ inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, 16000, userContent, SYSTEM_EDIT, tokenCallback));
  } else if (modelOpt.provider === "google") {
    ({ inputTokens, outputTokens } = await generateWithGoogle(modelOpt.model, 16000, userContent, SYSTEM_EDIT, tokenCallback));
  } else {
    ({ inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, 16000, userContent, SYSTEM_EDIT, tokenCallback));
  }

  const parsed = parseJsonOutput(text, existingFiles);
  if (!parsed || (Object.keys(parsed.files).length === 0 && !parsed.replacements?.length)) {
    throw new Error("Quick edit failed — try again or use a more detailed prompt.");
  }

  // Merge: AI only returns changed files
  const mergedFiles = { ...existingFiles, ...parsed.files };

  return {
    files: mergedFiles,
    summary: parsed.summary,
    modelUsed: modelOpt.displayName,
    complexity: "simple",
    complexityReasons: ["quick-edit"],
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(modelOpt.model, inputTokens, outputTokens),
  };
}

// ─── JSON output parser ──────────────────────────────────────────────────────

type ParsedOutput = {
  summary: string;
  files: ProjectFiles;
  replacements?: { file: string; search: string; replace: string }[];
};

function parseJsonOutput(text: string, existingFiles?: ProjectFiles | null): ParsedOutput | null {
  // Try multiple strategies to extract JSON from the response
  let jsonStr: string | null = null;

  // Strategy 1: extract from markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  // Strategy 2: find JSON object with "files" or "replacements"
  if (!jsonStr) {
    const jsonMatch = text.match(/\{[\s\S]*?"files"\s*:\s*\[[\s\S]*?\]\s*[\s\S]*?\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
  }

  // Strategy 3: find any JSON object
  if (!jsonStr) {
    const anyJson = text.match(/\{[\s\S]*("files"|"replacements")[\s\S]*\}/);
    if (anyJson) jsonStr = anyJson[0];
  }

  // Strategy 4: the entire response might be JSON
  if (!jsonStr && text.trim().startsWith("{")) {
    jsonStr = text.trim();
  }

  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr) as {
      files?: { path: string; content: string }[];
      replacements?: { file: string; search: string; replace: string }[];
      summary?: string;
    };

    // Handle replacements format (line-replace — fast edits)
    if (parsed.replacements && Array.isArray(parsed.replacements) && parsed.replacements.length > 0) {
      const files: ProjectFiles = {};
      if (existingFiles) {
        // Apply each replacement to the existing files
        for (const r of parsed.replacements) {
          const filePath = r.file;
          const source = files[filePath] ?? existingFiles[filePath] ?? "";
          if (source.includes(r.search)) {
            files[filePath] = source.replace(r.search, r.replace);
          } else {
            // Fuzzy match — try trimming whitespace
            const trimmedSearch = r.search.trim();
            if (source.includes(trimmedSearch)) {
              files[filePath] = source.replace(trimmedSearch, r.replace.trim());
            }
          }
        }
      }
      return { summary: parsed.summary || "Done! Check the preview.", files, replacements: parsed.replacements };
    }

    // Handle files format (full rewrite)
    if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
      const files: ProjectFiles = {};
      for (const f of parsed.files) {
        if (f.path && f.content) files[f.path] = f.content;
      }
      return { summary: parsed.summary || "Done! Check the preview.", files };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface GenerateResult {
  files: ProjectFiles;
  summary: string;
  modelUsed: string;
  complexity: Complexity;
  complexityReasons: string[];
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export async function generateProject(
  prompt: string,
  existingFiles: ProjectFiles | null,
  envVars: Record<string, string> | null,
  onToken?: (text: string) => void,
  onStatus?: (text: string) => void,
  imageBase64?: string | null,
  imageMimeType?: string,
  forceModel?: string,
  customKnowledge?: string | null,
  projectHistory?: string | null
): Promise<GenerateResult> {
  const { complexity, reasons: complexityReasons } = scoreComplexity(prompt, existingFiles);
  let modelOpt = forceModel && MODELS[forceModel] ? MODELS[forceModel] : pickModel(complexity);
  const isEdit = !!(existingFiles && Object.keys(existingFiles).length > 0);

  // Only inject a design system for new builds — edits must preserve existing design
  const pickedDesign = isEdit ? null : pickDesign(prompt);
  const designInjection = isEdit
    ? `EDITING AN EXISTING APP — DO NOT apply any new design system. Read the existing code and match its exact colors, fonts, spacing, and visual style. Your only job is to add/change what was requested.`
    : `${pickedDesign!.description}
COLORS (use exactly):
- body background: ${pickedDesign!.bg}
- card/surface: ${pickedDesign!.card}
- border: ${pickedDesign!.border}
- primary accent: ${pickedDesign!.accent}
- secondary accent: ${pickedDesign!.accent2}
- text: ${pickedDesign!.text}
- muted text: ${pickedDesign!.muted}
- border-radius: ${pickedDesign!.radius}
Make the entire layout and structure match this design system. It should look DRAMATICALLY different from a generic dark-mode app.`;

  const hasEnvVars = envVars && Object.keys(envVars).length > 0;
  const integrationsBlock = hasEnvVars
    ? `When env vars are provided via window.ENV, read keys from there. Use /api/upload for image uploads. Use window.tcSave/tcLoad for data persistence.`
    : "Use window.tcSave(key, value) and window.tcLoad(key, fallback) for data persistence. Use /api/upload for image uploads.";

  // Feature-level edits (add cart, add search, add admin) use BUILD prompt so the AI
  // generates complete, working features instead of minimal surgical stubs
  const isFeatureEdit = isEdit && /\b(add|create|build|implement|make|need)\b.*\b(cart|checkout|search|filter|admin|login|auth|payment|form|modal|page|section|nav|footer|header|sidebar|dashboard|gallery|slider|carousel|notification|chat|comment|review|rating|booking|calendar|upload|download|share|export|import|drag|drop|sort|pagina)\b/i.test(prompt);

  // All edits use short EDIT prompt for speed. Only new builds use full BUILD prompt.
  const SYSTEM_PROMPT = isEdit
    ? SYSTEM_EDIT
    : SYSTEM_BUILD
        .replace("{{DESIGN_INJECTION}}", designInjection)
        .replace("{{INTEGRATIONS_INJECTION}}", integrationsBlock);

  onStatus?.("Starting generation…");

  const envSection = envVars && Object.keys(envVars).length > 0
    ? `\n\nEnv vars: ${JSON.stringify(envVars)}`
    : "";

  let existingSection = "";
  if (existingFiles && Object.keys(existingFiles).length > 0) {
    const serialized = JSON.stringify(existingFiles);
    if (serialized.length < 60000) existingSection = serialized;
  }
  const knowledgeSection = customKnowledge ? `\n\nPROJECT KNOWLEDGE (always follow these conventions and requirements):\n${customKnowledge}` : "";
  const historySection = projectHistory ? `\n\nPROJECT HISTORY (what has been built so far — maintain all existing features, fix known issues, avoid regressions):\n${projectHistory}` : "";

  const year = new Date().getFullYear();
  const userContent = isEdit
    ? isFeatureEdit
      ? `Current files:\n${existingSection}${envSection}

ADD THIS FEATURE: ${prompt}

Build the COMPLETE feature with working state, UI, and interactions. "Add to cart" = cart state + buttons on every product + cart drawer + totals. "Add search" = input + filter + results. Keep ALL existing content intact. Return complete updated files.`
      : `Current files:\n${existingSection}${envSection}\n\nRequest: ${prompt}`
    : `Build this app: ${prompt}${envSection}${knowledgeSection}\n\nToday's date: ${new Date().toISOString().slice(0, 10)}. Use the current year (${year}) for any copyright notices.`;

  let text = "";
  let stopped = false;
  let inputTokens = 0, outputTokens = 0;

  const statusMap: [number, string][] = [
    [100,   "Analyzing your request…"],
    [500,   "Planning app structure…"],
    [1200,  "Writing HTML shell…"],
    [2500,  "Building React components…"],
    [5000,  "Adding state & interactions…"],
    [9000,  "Wiring up data & logic…"],
    [15000, "Styling & polishing UI…"],
    [22000, "Finalizing & cleaning up…"],
  ];
  let lastStatusIdx = -1;
  const tokenCallback = (token: string) => {
    text += token;
    onToken?.(token);
    for (let i = statusMap.length - 1; i >= 0; i--) {
      if (text.length >= statusMap[i][0] && i > lastStatusIdx) {
        lastStatusIdx = i;
        onStatus?.(statusMap[i][1]);
        break;
      }
    }
  };

  try {
    if (modelOpt.provider === "anthropic") {
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType));
    } else if (modelOpt.provider === "openai") {
      ({ stopped, inputTokens, outputTokens } = await generateWithOpenAI(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    } else if (modelOpt.provider === "google") {
      ({ stopped, inputTokens, outputTokens } = await generateWithGoogle(modelOpt.model, modelOpt.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback));
    }
  } catch {
    // Provider failed — silently fall back to Claude Sonnet
    const fallback = MODELS["claude-sonnet-4-6"];
    if (modelOpt.provider !== "anthropic") {
      text = "";
      lastStatusIdx = -1;
      ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(
        fallback.model, fallback.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType
      ));
      modelOpt = { ...fallback };
    } else {
      throw new Error("Generation failed. Please try again.");
    }
  }

  // If output was cut off and we're not already on Sonnet, retry with Sonnet
  if (stopped && modelOpt.model !== "claude-sonnet-4-6") {
    const sonnet = MODELS["claude-sonnet-4-6"];
    text = "";
    lastStatusIdx = -1;
    ({ stopped, inputTokens, outputTokens } = await generateWithAnthropic(
      sonnet.model, sonnet.maxTokens, userContent, SYSTEM_PROMPT, tokenCallback, imageBase64, imageMimeType
    ));
    modelOpt = { ...sonnet };
  }

  if (stopped) {
    throw new Error(
      `Response was cut off (${modelOpt.displayName} hit its output limit). ` +
      "Try breaking your request into steps — build the basics first, then add features one at a time."
    );
  }

  const parsed = parseJsonOutput(text, existingFiles);

  if (!parsed) {
    throw new Error("Model did not return files in the expected format. Please try again.");
  }

  if (!isEdit) {
    if (!parsed.files["/App.tsx"]) {
      throw new Error("Model response was incomplete — missing App.js. Please try again.");
    }
    if (parsed.files["/App.tsx"].length < 200) {
      throw new Error("Model returned a near-empty app. Please try again or rephrase your request.");
    }
  }

  // Resolve {{unsplash:...}} tokens → real photo URLs
  // Skip for edits (no new images) to save 2-8s
  let resolvedFiles: ProjectFiles;
  const hasTokens = Object.values(parsed.files).some(c => UNSPLASH_TOKEN.test(c));
  UNSPLASH_TOKEN.lastIndex = 0;
  if (hasTokens) {
    try {
      resolvedFiles = await Promise.race([
        resolveImages(parsed.files),
        new Promise<ProjectFiles>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
      ]);
    } catch {
      resolvedFiles = {} as ProjectFiles;
      for (const [path, content] of Object.entries(parsed.files)) {
        resolvedFiles[path] = content.replace(UNSPLASH_TOKEN, (_full, qRaw: string, ws?: string, hs?: string) => {
          const w = ws ? parseInt(ws, 10) : 1200;
          const h = hs ? parseInt(hs, 10) : 800;
          return picsumUrl(qRaw.trim(), w, h);
        });
      }
    }
  } else {
    resolvedFiles = parsed.files;
  }

  // For edits: merge returned files with existing (AI only returns changed files)
  const finalFiles = isEdit && existingFiles
    ? { ...existingFiles, ...resolvedFiles }
    : resolvedFiles;

  return {
    files: finalFiles,
    summary: parsed.summary,
    modelUsed: modelOpt.displayName,
    complexity,
    complexityReasons,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(modelOpt.model, inputTokens, outputTokens),
  };
}

export function defaultProjectFiles(): ProjectFiles {
  return {
    "/App.tsx": `import './index.css';\n\nexport default function App() {\n  return (\n    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>\n      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your app will appear here</h1>\n      <p style={{ color: "hsl(var(--muted-foreground))" }}>Describe what you want to build in the chat.</p>\n    </div>\n  );\n}`,
    "/index.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');\n\n:root {\n  --background: 0 0% 100%;\n  --foreground: 222 47% 11%;\n  --primary: 262 83% 58%;\n  --primary-foreground: 0 0% 100%;\n  --secondary: 210 40% 96%;\n  --secondary-foreground: 222 47% 11%;\n  --muted: 210 40% 96%;\n  --muted-foreground: 215 16% 47%;\n  --accent: 210 40% 96%;\n  --accent-foreground: 222 47% 11%;\n  --destructive: 0 84% 60%;\n  --destructive-foreground: 0 0% 100%;\n  --border: 214 32% 91%;\n  --input: 214 32% 91%;\n  --ring: 262 83% 58%;\n  --card: 0 0% 100%;\n  --card-foreground: 222 47% 11%;\n  --radius: 0.5rem;\n}\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }`,
  };
}
