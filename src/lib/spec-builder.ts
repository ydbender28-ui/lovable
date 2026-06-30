import Anthropic from "@anthropic-ai/sdk";

export interface BuildSpec {
  enhancedPrompt: string;
  componentPlan: string;
}

export async function buildSpec(prompt: string): Promise<BuildSpec> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const [enhanceRes, architectRes] = await Promise.all([
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are an expert at writing prompts for AI web app generators. Rewrite the following prompt to be more specific, detailed, and actionable. Add relevant UI details, features, and design direction. Keep it under 120 words. Return ONLY the improved prompt with no preamble.\n\nOriginal prompt: ${prompt}`,
      }],
    }),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `You are a web page architect. Given a build request, choose which pre-built sections to use and in what order.

AVAILABLE SECTIONS (use ONLY these names):
Navbar, Hero, Banner, Stats, Features, SplitSection, MenuGrid, ShopGrid, Gallery, Team, Timeline, Testimonials, LogoCloud, BlogGrid, PricingTable, FAQ, Newsletter, CTA, Booking, Contact, Footer, Tabs

Rules:
- ALWAYS start with Navbar, then Hero
- ALWAYS end with Contact (if relevant) and Footer
- MenuGrid = food menus with cart. ShopGrid = product stores with cart. Never use both.
- Pick 6-10 sections total that make sense for this type of site

Return JSON only:
{
  "sections": ["Navbar", "Hero", "...in order...", "Footer"],
  "features": ["2-3 specific content/interactive features to include"]
}`,
      messages: [{ role: "user", content: `Build request: ${prompt}` }],
    }),
  ]);

  const enhanced = enhanceRes.content[0].type === "text"
    ? enhanceRes.content[0].text.trim()
    : prompt;

  let componentPlan = "";
  try {
    const raw = (architectRes.content[0] as { type: string; text: string }).text;
    const cleaned = raw.includes("```") ? raw.split("```")[1].replace("json","").trim() : raw.trim();
    const plan = JSON.parse(cleaned);
    const parts: string[] = [];
    if (plan.sections?.length) parts.push(`Use these sections in this order: ${plan.sections.join(" → ")}`);
    if (plan.features?.length) parts.push(`Include: ${plan.features.join(", ")}`);
    componentPlan = parts.join("\n");
  } catch {
    // Architect call failed to parse — proceed without plan
  }

  return { enhancedPrompt: enhanced, componentPlan };
}
