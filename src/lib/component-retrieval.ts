// Pulls real-world components from Supabase scraped_components table
// and injects them as examples into the generation prompt

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

// Map our website knowledge categories to component categories
const CATEGORY_MAP: Record<string, string[]> = {
  restaurant_cafe:   ['hero', 'menu', 'cards', 'testimonials'],
  saas_landing:      ['hero', 'features', 'pricing', 'testimonials'],
  ecommerce:         ['hero', 'cards', 'banner', 'testimonials'],
  portfolio_agency:  ['hero', 'cards', 'testimonials', 'gallery'],
  dashboard_app:     ['dashboard', 'sidebar', 'stats'],
  blog_editorial:    ['hero', 'blog', 'cards'],
  landing_service:   ['hero', 'features', 'form', 'testimonials'],
  mobile_app_landing:['hero', 'features', 'pricing'],
}

async function embedText(text: string): Promise<number[] | null> {
  if (!OPENAI_KEY) return null
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json() as { data: { embedding: number[] }[] }
    return data.data[0].embedding
  } catch {
    return null
  }
}

async function matchComponents(
  embedding: number[],
  industry: string | null,
  limit = 4
): Promise<{ component_name: string; category: string; tsx_code: string; quality_score: number }[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_components`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_industry: industry,
        min_quality: 7,
        match_count: limit,
      }),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function detectIndustry(prompt: string): string | null {
  const p = prompt.toLowerCase()
  if (/pizza|restaurant|cafe|coffee|food|menu|dining|bakery|sushi|bar/.test(p)) return 'restaurant'
  if (/shop|store|ecommerce|buy|product|cart|fashion|clothing/.test(p)) return 'ecommerce'
  if (/saas|software|platform|dashboard|analytics|crm|startup/.test(p)) return 'saas'
  if (/portfolio|agency|designer|freelance|studio/.test(p)) return 'portfolio'
  if (/blog|magazine|news|articles/.test(p)) return 'media'
  if (/finance|bank|fintech|payment/.test(p)) return 'finance'
  if (/health|fitness|wellness|medical/.test(p)) return 'health'
  return null
}

export async function getRelevantComponents(prompt: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) return ''

  try {
    const embedding = await embedText(prompt)
    if (!embedding) return ''

    const industry = detectIndustry(prompt)
    const components = await matchComponents(embedding, industry, 4)
    if (!components || components.length === 0) return ''

    const examples = components
      .slice(0, 3)
      .map(c => `### ${c.component_name} (${c.category}, ★${c.quality_score})\n\`\`\`tsx\n${c.tsx_code.slice(0, 300)}\n\`\`\``)
      .join('\n\n')

    return `## Real-World Component Examples (scraped from live sites, quality ≥7):
Use these as inspiration for layout patterns, spacing, and visual style. Adapt them — don't copy verbatim.

${examples}`
  } catch {
    return ''
  }
}
