import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]/knowledge">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(JSON.parse(project.knowledge || "[]"));
}

export async function PUT(req: Request, ctx: RouteContext<"/api/projects/[id]/knowledge">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  await prisma.project.updateMany({
    where: { id, ownerId: session.user.id },
    data: { knowledge: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
