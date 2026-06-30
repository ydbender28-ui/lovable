// Dynamic builder config — fetches prompt additions + forbidden patterns from Supabase
// Training agent writes here; generate.ts reads here. No redeploy needed.

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

let cache: { additions: string; forbidden: string; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function fetchConfig(key: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return ''
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/builder_config?key=eq.${key}&select=value`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(3000),
      }
    )
    if (!res.ok) return ''
    const rows = await res.json() as { value: string }[]
    return rows[0]?.value ?? ''
  } catch {
    return ''
  }
}

export async function getBuilderConfig(): Promise<{ additions: string; forbidden: string }> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return { additions: cache.additions, forbidden: cache.forbidden }
  }
  const [additions, forbidden] = await Promise.all([
    fetchConfig('system_prompt_additions'),
    fetchConfig('forbidden_patterns'),
  ])
  cache = { additions, forbidden, fetchedAt: Date.now() }
  return { additions, forbidden }
}

export async function saveUserBuild(
  prompt: string,
  appTsx: string,
  category: string,
  qualityScore: number,
  modelUsed: string,
  buildTimeMs: number,
  embedding: number[] | null
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/user_builds`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 2000),
        app_tsx: appTsx.slice(0, 50000),
        category,
        quality_score: qualityScore,
        model_used: modelUsed,
        build_time_ms: buildTimeMs,
        embedding: embedding ? JSON.stringify(embedding) : null,
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Non-fatal — don't break builds
  }
}

export async function getSimilarBuilds(embedding: number[]): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return ''
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_user_builds`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query_embedding: embedding, match_count: 2, min_quality: 7.5 }),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return ''
    const builds = await res.json() as { prompt: string; app_tsx: string; similarity: number }[]
    if (!builds?.length) return ''

    const examples = builds.map((b, i) =>
      `### Past Build Example ${i + 1} (similarity: ${(b.similarity * 100).toFixed(0)}%)\nPrompt: "${b.prompt.slice(0, 100)}"\n\`\`\`tsx\n${b.app_tsx.slice(0, 600)}\n\`\`\``
    ).join('\n\n')

    return `## Similar Past Builds (real user builds that scored well — use as structural reference):\n${examples}`
  } catch {
    return ''
  }
}
