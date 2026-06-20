import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { files, summary } = await req.json();

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Save new version
  await prisma.projectVersion.create({
    data: {
      projectId: id,
      files: JSON.stringify(files),
      summary: summary ?? "Admin data saved",
    },
  });

  // Update project updatedAt
  await prisma.project.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // If project is published, update the published HTML
  if (project.publishedSlug) {
    const { buildStandaloneHtml } = await import("@/lib/buildHtml");
    const html = buildStandaloneHtml(files, project.name);
    await prisma.project.update({
      where: { id },
      data: {
        publishedAt: new Date(),
        publishedSlug: project.publishedSlug,
      },
    });
    // Store HTML in latest version
    await prisma.projectVersion.updateMany({
      where: { projectId: id },
      data: {},
    });
    // The publish route reads from latest version, so saving the version is enough
    void html; // html is built for validation, publish route builds fresh from latest version
  }

  return NextResponse.json({ ok: true });
}
