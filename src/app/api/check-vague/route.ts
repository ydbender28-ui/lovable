import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const CLARIFIER_PROMPT = `You are ThatCode's intent clarifier. Decide if a build request needs one clarifying question before generating.

Rules:
- Proceed immediately if the request mentions a specific domain, product, industry, or feature
- Ask ONE question only if the request is so vague that any answer would be wildly different (e.g. "build an app" with zero context)
- Never ask about colors, fonts, or copy — make smart defaults
- Ask about: core functionality, target audience, business model, or key differentiator

Respond with JSON only:
{
  "action": "proceed" | "clarify",
  "question": "string (only if action=clarify — make it specific and helpful)",
  "understanding": "one sentence of what you understood"
}

Examples:
- "build a coffee shop landing page" → {"action":"proceed","understanding":"A landing page for a coffee shop with menu, hours, and atmosphere"}
- "build an app" → {"action":"clarify","question":"What does your app do — what's the core problem it solves for users?","understanding":"A generic app request with no domain"}
- "saas for project management" → {"action":"proceed","understanding":"A SaaS landing page for a project management tool"}
- "make me a website" → {"action":"clarify","question":"What kind of business or project is this website for?","understanding":"A website with no specified domain or purpose"}`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { prompt } = await req.json();
  if (!prompt) return Response.json({ action: "proceed", vague: false, understanding: "" });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: CLARIFIER_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (res.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/^```json\n?/m, "").replace(/^```\n?/m, "").replace(/```$/m, "").trim();
    const result = JSON.parse(cleaned);

    return Response.json({
      action: result.action ?? "proceed",
      question: result.question,
      understanding: result.understanding ?? "",
      vague: result.action === "clarify", // backward compat
    });
  } catch {
    return Response.json({ action: "proceed", vague: false, understanding: "" });
  }
}
