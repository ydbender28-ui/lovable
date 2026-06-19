import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const requestedSlug = body.slug ? toSlug(body.slug) : null;
  const customDomain: string | null = body.customDomain?.trim().toLowerCase().replace(/^https?:\/\//, "") || null;
  const publishPassword: string | null = body.password?.trim() || null;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.versions[0]) return NextResponse.json({ error: "No generated version yet" }, { status: 400 });

  const files = JSON.parse(project.versions[0].files);
  const html = buildStandaloneHtml(files, project.name);

  let slug = requestedSlug || project.publishSlug || toSlug(project.name);
  if (!slug || slug.length < 2) slug = `app-${Math.random().toString(36).slice(2, 8)}`;

  const existing = await prisma.project.findUnique({ where: { publishSlug: slug } });
  if (existing && existing.id !== id) {
    if (requestedSlug) return NextResponse.json({ error: `"${slug}" is already taken.` }, { status: 409 });
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Check custom domain uniqueness
  if (customDomain) {
    const domainConflict = await prisma.project.findUnique({ where: { customDomain } });
    if (domainConflict && domainConflict.id !== id) {
      return NextResponse.json({ error: "That domain is already connected to another project." }, { status: 409 });
    }
  }

  await prisma.project.update({
    where: { id },
    data: {
      publishSlug: slug,
      publishedHtml: html,
      publishedAt: new Date(),
      ...(customDomain !== undefined ? { customDomain } : {}),
      ...(publishPassword !== undefined ? { publishPassword } : {}),
    },
  });

  const domain = process.env.PUBLISH_DOMAIN ?? "thatcode.dev";
  const url = `https://${slug}.${domain}`;

  return NextResponse.json({ url, customDomain, slug });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.project.updateMany({
    where: { id, ownerId: session.user.id },
    data: { publishSlug: null, publishedHtml: null, publishedAt: null, customDomain: null, publishPassword: null },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  await prisma.project.updateMany({
    where: { id, ownerId: session.user.id },
    data: {
      ...(body.customDomain !== undefined ? { customDomain: body.customDomain || null } : {}),
      ...(body.password !== undefined ? { publishPassword: body.password || null } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
