import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Brand voice stored in project knowledge field
  const knowledge: Array<{ id: string; title: string; content: string }> = JSON.parse(project.knowledge || "[]");
  const brandVoice = knowledge.find(k => k.title === "__brand_voice__");
  return NextResponse.json({ brandVoice: brandVoice ? JSON.parse(brandVoice.content) : null });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const { tone, values, personality, examples } = await req.json();

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brandVoice = { tone, values, personality, examples };

  // Generate a build prompt that rewrites all copy in this voice
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Brand voice settings:
Tone: ${tone}
Values: ${values}
Personality: ${personality}
Example phrases: ${examples}

Write a concise prompt (2-3 sentences) instructing an AI to rewrite ALL user-facing strings in this app (error messages, empty states, button labels, onboarding copy, tooltips) to match this brand voice consistently.`,
    }],
  });

  const rewritePrompt = (res.content[0] as { type: string; text: string }).text.trim();

  // Save brand voice to project knowledge
  const knowledge: Array<{ id: string; title: string; content: string }> = JSON.parse(project.knowledge || "[]");
  const existingIdx = knowledge.findIndex(k => k.title === "__brand_voice__");
  const entry = { id: "__brand_voice__", title: "__brand_voice__", content: JSON.stringify(brandVoice) };
  if (existingIdx >= 0) knowledge[existingIdx] = entry;
  else knowledge.push(entry);

  await prisma.project.update({ where: { id }, data: { knowledge: JSON.stringify(knowledge) } });

  return NextResponse.json({ ok: true, brandVoice, rewritePrompt });
}
