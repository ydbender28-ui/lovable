import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { email, role = "editor" } = await req.json();

  // Only owner/admin can invite
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: id, userId: session.user.id, role: { in: ["owner", "admin"] } },
  });
  const isOwner = await prisma.workspace.findFirst({ where: { id, ownerId: session.user.id } });
  if (!membership && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) return NextResponse.json({ error: "User not found. They must sign up first." }, { status: 404 });

  const existing = await prisma.workspaceMember.findFirst({ where: { workspaceId: id, userId: invitee.id } });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const member = await prisma.workspaceMember.create({
    data: { workspaceId: id, userId: invitee.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(member);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { userId } = await req.json();

  const isOwner = await prisma.workspace.findFirst({ where: { id, ownerId: session.user.id } });
  if (!isOwner && userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.workspaceMember.deleteMany({ where: { workspaceId: id, userId } });
  return NextResponse.json({ ok: true });
}
