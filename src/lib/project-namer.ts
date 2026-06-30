// Shared utility: generate a smart project name from a build prompt

function fallbackName(prompt: string): string {
  const filler = /^(build|make|create|i need|i want|please|can you|generate|a|an|the|me|us)\s+/gi;
  const cleaned = prompt.trim().replace(filler, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1) || "New Project";
}

export async function nameFromPrompt(prompt: string): Promise<string> {
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [{
        role: "user",
        content: `Generate a creative, memorable brand name for this project. Think like a startup founder naming their company — short, catchy, professional. 2-3 words max. No generic descriptions like "Coffee Shop" — give it a real brand identity. No punctuation, reply with ONLY the name.\n\nExamples:\n"coffee shop landing page" → "Brew & Bloom"\n"todo app with reminders" → "Taskflow"\n"admin dashboard for products" → "Nexus Dashboard"\n"landing page for my startup" → "LaunchPad"\n"restaurant website" → "Hearth & Table"\n"fitness tracker app" → "PulseTrack"\n"portfolio website for photographer" → "Shutter Studio"\n\nDescription: ${prompt.slice(0, 300)}`,
      }],
    });
    const name = (msg.content[0] as { text: string }).text.trim().replace(/['"]/g, "");
    return name || fallbackName(prompt);
  } catch {
    return fallbackName(prompt);
  }
}

/** Returns true if the name looks like an auto-generated placeholder */
export function isGenericName(name: string): boolean {
  return /^(new project|untitled|project \d+)$/i.test(name.trim());
}
