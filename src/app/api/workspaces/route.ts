import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } }, _count: { select: { projects: true } } } } },
  });
  const owned = await prisma.workspace.findMany({
    where: { ownerId: session.user.id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } }, _count: { select: { projects: true } } },
  });

  const all = [...owned, ...memberships.map(m => m.workspace)];
  const unique = Array.from(new Map(all.map(w => [w.id, w])).values());
  return NextResponse.json(unique);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "owner" } },
    },
    include: { members: true },
  });
  return NextResponse.json(workspace);
}
