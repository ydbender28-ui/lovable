import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!project?.versions[0]) return NextResponse.json({ error: "No code" }, { status: 400 });

  const files: Record<string, string> = JSON.parse(project.versions[0].files);
  const code = Object.values(files).join("\n").slice(0, 20000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: `You are a business model expert. Analyze a React app and recommend the best monetization strategy. Return JSON only:
{
  "appCategory": "SaaS tool | marketplace | content platform | e-commerce | productivity | service",
  "strategies": [
    {
      "name": "Subscription",
      "model": "Monthly recurring revenue",
      "suggestedPrice": "$29/month",
      "estimatedMRR": "$14,500 at 500 users",
      "pros": ["Predictable revenue", "Lower sales friction"],
      "cons": ["Churn risk", "Must deliver ongoing value"],
      "comparables": ["Notion ($16/mo), Linear ($8/mo)"],
      "fit": 92
    },
    {
      "name": "Usage-based",
      "model": "Pay per generation/action",
      "suggestedPrice": "$0.10 per operation",
      "estimatedMRR": "$8,000 at medium usage",
      "pros": ["Scales with value delivered", "No upfront friction"],
      "cons": ["Unpredictable revenue", "Hard to budget for users"],
      "comparables": ["OpenAI API, Twilio"],
      "fit": 61
    }
  ],
  "recommended": "Subscription",
  "launchPrice": "$19/month",
  "willingness_to_pay_reasoning": "Tools in this category typically price $15-49/month. Users save 5+ hours/week — $19 is an easy sell.",
  "buildPrompt": "Add full billing infrastructure for the subscription model: pricing page with 3 plan tiers (Free/Pro/Team), Stripe Checkout integration, upgrade prompts when hitting free tier limits, billing settings page with cancel/upgrade options, usage indicator showing feature limit progress."
}`,
    messages: [{ role: "user", content: `Build a revenue model for this app:\n\nApp name: ${project.name}\n\n${code}` }],
  });

  try {
    const text = (res.content[0] as { type: string; text: string }).text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: "Revenue modeling failed" }, { status: 500 });
  }
}
