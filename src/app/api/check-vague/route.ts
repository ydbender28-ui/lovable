import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const CLARIFIER_PROMPT = `You are ThatCode's intent clarifier. Analyze the build request and decide if clarifying questions are needed.

RULES:
- If the request is specific enough (has industry + purpose + rough feature set) → proceed immediately
- If the request needs more context → ask 2-3 SHORT, targeted questions based on the detected type
- Never ask about colors, fonts, copy, or tech stack — make smart defaults
- Questions must be SPECIFIC to the detected industry/type
- Keep questions short (max 8 words each)

QUESTION TEMPLATES by type:
- restaurant/food: ["Website or online ordering app?", "Delivery, dine-in, or both?", "Casual or upscale vibe?"]
- saas/software: ["Marketing page or working dashboard?", "B2B or consumer product?", "Free trial or paid-only?"]
- portfolio: ["Designer, developer, or photographer?", "Seeking jobs or freelance clients?"]
- ecommerce/shop: ["What are you selling?", "Small boutique or large catalog?"]
- fitness/health: ["Gym, personal trainer, or wellness brand?", "Classes, memberships, or one-on-one?"]
- event: ["One-time event or recurring?", "Free or ticketed?"]
- blog/media: ["Personal blog or publication?", "What topics?"]
- agency: ["Design, marketing, or dev agency?", "Local or remote clients?"]
- generic: ["What does this do or sell?", "Who is the target user?"]

Respond with JSON only — no markdown:
{
  "action": "proceed" | "clarify",
  "questions": ["question1", "question2"],
  "understanding": "one sentence of what you understood",
  "detectedType": "restaurant|saas|portfolio|ecommerce|fitness|event|blog|agency|generic"
}

- "proceed" → questions array is empty
- "clarify" → 2-3 questions max, targeted to the detected type
- understanding is always filled in

Examples:
- "build a pizza shop" → {"action":"clarify","questions":["Website or online ordering app?","Delivery, dine-in, or both?","Casual or upscale vibe?"],"understanding":"A pizza restaurant that needs a web presence","detectedType":"restaurant"}
- "build a landing page for my SaaS that tracks employee time" → {"action":"proceed","questions":[],"understanding":"A SaaS landing page for employee time tracking","detectedType":"saas"}
- "make me a website" → {"action":"clarify","questions":["What does this website do or sell?","Who is the target user?"],"understanding":"A website with no specified purpose","detectedType":"generic"}
- "create a portfolio for me" → {"action":"clarify","questions":["Designer, developer, or photographer?","Seeking jobs or freelance clients?"],"understanding":"A personal portfolio site","detectedType":"portfolio"}`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { prompt, answers } = await req.json();
  if (!prompt) return Response.json({ action: "proceed", vague: false, understanding: "" });

  // If answers were provided, enrich the understanding for the build
  if (answers && Object.keys(answers).length > 0) {
    const enriched = Object.entries(answers)
      .map(([q, a]) => `${q}: ${a}`)
      .join(". ");
    return Response.json({
      action: "proceed",
      enrichedPrompt: `${prompt}. Additional context: ${enriched}`,
      understanding: `Building based on: ${prompt}. User specified: ${enriched}`,
      vague: false,
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      system: CLARIFIER_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (res.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/^```json\n?/m, "").replace(/^```\n?/m, "").replace(/```$/m, "").trim();
    const result = JSON.parse(cleaned);

    return Response.json({
      action: result.action ?? "proceed",
      questions: result.questions ?? [],
      question: result.questions?.[0], // backward compat
      understanding: result.understanding ?? "",
      detectedType: result.detectedType ?? "generic",
      vague: result.action === "clarify",
    });
  } catch {
    return Response.json({ action: "proceed", vague: false, understanding: "", questions: [] });
  }
}
