import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string; versionId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, versionId } = await ctx.params;
  const { note, bookmarked } = await req.json();

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.version.update({
    where: { id: versionId },
    data: { bookmarked: bookmarked ?? true, bookmarkNote: note ?? null },
  });
  return NextResponse.json({ ok: true });
}
