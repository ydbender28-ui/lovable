import { NextResponse } from "next/server";

export const maxDuration = 120;
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });
  void id;

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a monetization engineer. Given a business model description, output a complete build prompt that adds Stripe-powered monetization to an existing React app.

Return JSON only:
{
  "summary": "One-line summary of the billing setup",
  "plans": [{ "name": "Pro", "price": 19, "interval": "month", "features": ["feature1"] }],
  "buildPrompt": "Detailed prompt to send to the AI to add full Stripe monetization. Include: pricing page UI with plan cards, Stripe Checkout session creation (using fetch to a hypothetical /api/checkout endpoint), a 'Manage billing' button that opens Stripe Customer Portal, trial badge on the UI, upgrade prompts when hitting limits. The prompt must be very specific and complete."
}`,
    messages: [{ role: "user", content: `Business model: ${description}` }],
  });

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: "Failed to parse monetization plan" }, { status: 500 });
  }
}
