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
      max_tokens: 800,
      system: `You are an expert software architect. Given a build request, produce a concise implementation plan. Be specific and concrete.

Return JSON only:
{
  "title": "What we'll build",
  "overview": "2-sentence summary",
  "components": ["list of key UI components"],
  "dataModels": ["key data structures/entities"],
  "features": ["specific interactive features"]
}`,
      messages: [{ role: "user", content: `This is a new project. Build request: ${prompt}` }],
    }),
  ]);

  const enhanced = enhanceRes.content[0].type === "text"
    ? enhanceRes.content[0].text.trim()
    : prompt;

  let componentPlan = "";
  try {
    const raw = (architectRes.content[0] as { type: string; text: string }).text;
    const plan = JSON.parse(raw);
    const parts: string[] = [];
    if (plan.overview) parts.push(plan.overview);
    if (plan.components?.length) parts.push(`Components: ${plan.components.join(", ")}`);
    if (plan.dataModels?.length) parts.push(`Data: ${plan.dataModels.join(", ")}`);
    if (plan.features?.length) parts.push(`Features: ${plan.features.join(", ")}`);
    componentPlan = parts.join("\n");
  } catch {
    // Architect call failed to parse — proceed without plan
  }

  return { enhancedPrompt: enhanced, componentPlan };
}
