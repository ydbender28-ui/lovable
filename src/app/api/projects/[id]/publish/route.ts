import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(_req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.versions[0]) return NextResponse.json({ error: "No generated version yet" }, { status: 400 });

  const files = JSON.parse(project.versions[0].files);
  const html = buildStandaloneHtml(files, project.name);

  // Generate a unique slug
  let slug = toSlug(project.name);
  const existing = await prisma.project.findUnique({ where: { publishSlug: slug } });
  if (existing && existing.id !== id) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await prisma.project.update({
    where: { id },
    data: {
      publishSlug: slug,
      publishedHtml: html,
      publishedAt: new Date(),
    },
  });

  const domain = process.env.PUBLISH_DOMAIN ?? "thatcode.dev";
  const url = `https://${slug}.${domain}`;

  return NextResponse.json({ url });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await prisma.project.updateMany({
    where: { id, ownerId: session.user.id },
    data: { publishSlug: null, publishedHtml: null, publishedAt: null },
  });

  return NextResponse.json({ ok: true });
}
