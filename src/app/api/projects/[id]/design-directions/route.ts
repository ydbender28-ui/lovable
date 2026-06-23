import { NextResponse } from "next/server";

export const maxDuration = 120;
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/design-directions">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt } = await req.json();

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: `You generate 3 distinct design directions for a web app. Each direction should feel genuinely different — not just color swaps. Vary the layout style, mood, and typography approach.

Return ONLY valid JSON in this exact shape, no other text:
{
  "directions": [
    {
      "name": "Direction name (2-3 words)",
      "description": "One sentence describing the vibe and target audience",
      "bg": "#hex",
      "accent": "#hex",
      "text": "#hex",
      "style": "One phrase like 'Minimal & editorial' or 'Bold & colorful' or 'Dark & technical'"
    }
  ]
}`,
    messages: [{ role: "user", content: `App idea: ${prompt}\n\nGenerate 3 design directions.` }],
  });

  try {
    const raw = (res.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ directions: [] });
  }
}
