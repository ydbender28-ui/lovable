import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 }, messages: { orderBy: { createdAt: "desc" }, take: 1, where: { role: "assistant" } } },
  });

  if (!project || !project.versions[0]) return NextResponse.json({ files: null });

  return NextResponse.json({
    files: JSON.parse(project.versions[0].files),
    summary: project.messages[0]?.content ?? "Done! Check the preview.",
    updatedAt: project.versions[0].createdAt,
  });
}
