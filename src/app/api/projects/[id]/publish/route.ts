import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";

async function addVercelDomain(domain: string): Promise<{ cname: string; error?: string }> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return { cname: "domains.thatcode.dev" };

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
  const data = await res.json();

  if (!res.ok && data.error?.code !== "domain_already_in_use") {
    return { cname: "domains.thatcode.dev", error: data.error?.message };
  }

  // Get verification/DNS info
  const infoRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains/${domain}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const info = await infoRes.json();
  // Apex domains (e.g. thatcode.xyz) use an A record pointing to Vercel's IP
  // Subdomains (e.g. app.thatcode.xyz) use a CNAME
  const isApex = domain.split(".").length === 2;
  const cname = isApex ? "76.76.21.21" : "domains.thatcode.dev";

  return { cname };
}

async function removeVercelDomain(domain: string) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return;
  await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

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

  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id, ownerId: session.user.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.versions[0]) return NextResponse.json({ error: "No generated version yet" }, { status: 400 });

  const hideBadge = user?.plan === "pro" || user?.plan === "team" || user?.plan === "owner";
  const files = JSON.parse(project.versions[0].files);

  // Determine slug first so we can embed it in the storage polyfill
  let slug = requestedSlug || project.publishSlug || toSlug(project.name);
  if (!slug || slug.length < 2) slug = `app-${Math.random().toString(36).slice(2, 8)}`;

  const existing = await prisma.project.findUnique({ where: { publishSlug: slug } });
  if (existing && existing.id !== id) {
    if (requestedSlug) return NextResponse.json({ error: `"${slug}" is already taken.` }, { status: 409 });
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const html = buildStandaloneHtml(files, project.name, id, hideBadge, slug);

  // Check custom domain uniqueness
  if (customDomain) {
    const domainConflict = await prisma.project.findUnique({ where: { customDomain } });
    if (domainConflict && domainConflict.id !== id) {
      return NextResponse.json({ error: "That domain is already connected to another project." }, { status: 409 });
    }
  }

  // Register custom domain with Vercel
  let vercelCname = "domains.thatcode.dev";
  let domainError: string | undefined;
  if (customDomain) {
    const result = await addVercelDomain(customDomain);
    vercelCname = result.cname;
    domainError = result.error;
  }

  // If old custom domain is being replaced, remove it from Vercel
  if (project.customDomain && project.customDomain !== customDomain) {
    removeVercelDomain(project.customDomain).catch(() => {});
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

  const baseDomain = process.env.PUBLISH_DOMAIN ?? "thatcode.dev";
  const url = `https://${slug}.${baseDomain}`;

  return NextResponse.json({ url, customDomain, slug, vercelCname, domainError });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (project?.customDomain) removeVercelDomain(project.customDomain).catch(() => {});
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
