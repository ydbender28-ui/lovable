import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id, deletedAt: null },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...project,
    files: JSON.parse(project.versions[0]?.files ?? "{}"),
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: keeps Version rows so admin cost tracking stays accurate.
  // Messages are safe to remove (they're not needed for cost tracking).
  await prisma.message.deleteMany({ where: { projectId: id } });
  await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
