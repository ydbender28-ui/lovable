import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type AgentTool } from "@/lib/agentTools";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await prisma.agent.findFirst({ where: { id, ownerId: session.user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(JSON.parse(agent.tools || "[]"));
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tools: AgentTool[] = await req.json();
  await prisma.agent.updateMany({
    where: { id, ownerId: session.user.id },
    data: { tools: JSON.stringify(tools) },
  });
  return NextResponse.json({ ok: true });
}
