/**
 * Institutional memory — records "why" decisions for every code change.
 * GET: returns recent decisions for a project.
 * POST: saves a new decision note (called automatically after generation).
 */
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

  // Pull last 30 messages that are assistant messages (decisions are baked into summaries)
  const messages = await prisma.message.findMany({
    where: { projectId: id, role: "user" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ decisions: messages.map(m => ({
    id: m.id,
    prompt: m.content.slice(0, 200),
    createdAt: m.createdAt,
  })) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const { prompt, filesAfter } = await req.json();
  if (!prompt || !filesAfter) return NextResponse.json({ ok: false });

  // Use Haiku to extract a "why" from the change
  const code = Object.entries(filesAfter as Record<string, string>)
    .map(([p, c]) => `// ${p}\n${c.slice(0, 3000)}`).join("\n").slice(0, 8000);

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `User request: "${prompt}"\n\nCode after change (excerpt):\n${code}\n\nWrite ONE sentence (under 100 chars) explaining the architectural/business REASON for this change. Focus on WHY not WHAT. Start with "Reason:" If it's a style change, say so briefly.`,
    }],
  });

  const reason = (res.content[0] as { type: string; text: string }).text.trim();

  // Store as a special message in project history
  await prisma.message.create({
    data: {
      projectId: id,
      role: "assistant",
      content: `[DECISION] ${reason} | Prompt: ${prompt.slice(0, 120)}`,
    },
  });

  return NextResponse.json({ ok: true, reason });
}
