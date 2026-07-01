import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStandaloneHtml } from "@/lib/buildHtml";
import { decrypt, isEncrypted } from "@/lib/crypto";
import Anthropic from "@anthropic-ai/sdk";

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

  // Use existing seoDescription or project name as fallback
  const seoDescription = project.seoDescription ?? undefined;
  const ogImage = project.thumbnail ?? undefined;
  const html = buildStandaloneHtml(files, project.name, id, hideBadge, slug, {
    title: project.name,
    description: seoDescription,
    ogImage,
  });

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

  // Deploy edge functions if project has Supabase and function files
  let functionsUrl: string | null = null;
  if (project.supabaseProjectId) {
    const edgeFunctions: Record<string, string> = {};
    for (const [path, content] of Object.entries(files as Record<string, string>)) {
      if (path.startsWith("/functions/") && path.endsWith(".js")) {
        const name = path.replace("/functions/", "").replace(".js", "");
        edgeFunctions[name] = content;
      }
    }
    if (Object.keys(edgeFunctions).length > 0) {
      const mgmtToken = process.env.SUPABASE_MANAGEMENT_TOKEN;
      const ref = project.supabaseProjectId;
      if (mgmtToken) {
        // Deploy each function
        for (const [name, code] of Object.entries(edgeFunctions)) {
          try {
            const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/functions/${name}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ name, body: code, verify_jwt: false }),
            });
            if (!res.ok) {
              await fetch(`https://api.supabase.com/v1/projects/${ref}/functions/${name}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ body: code, verify_jwt: false }),
              });
            }
          } catch { /* best effort */ }
        }
        // Set secrets
        if (project.envVars) {
          try {
            const raw = project.envVars;
            const secrets = JSON.parse(isEncrypted(raw) ? decrypt(raw) : raw);
            await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
              method: "POST",
              headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
              body: JSON.stringify(Object.entries(secrets).map(([n, v]) => ({ name: n, value: v }))),
            });
          } catch { /* best effort */ }
        }
        functionsUrl = `https://${ref}.supabase.co/functions/v1`;
      }
    }
  }

  const baseDomain = process.env.PUBLISH_DOMAIN ?? "thatcode.dev";
  const url = `https://${slug}.${baseDomain}`;

  // Fire-and-forget: generate SEO description if not already set
  if (!project.seoDescription) {
    setTimeout(async () => {
      try {
        const ai = new Anthropic();
        const appSource = JSON.stringify(files).slice(0, 3000);
        const msg = await ai.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 120,
          messages: [{
            role: "user",
            content: `Write a 1-2 sentence SEO meta description for a web app named "${project.name}". Be specific and compelling. Source snippet: ${appSource}. Return only the description text, no quotes or labels.`,
          }],
        });
        const desc = (msg.content[0] as { text?: string }).text?.trim();
        if (desc) {
          await prisma.project.update({ where: { id }, data: { seoDescription: desc } }).catch(() => {});
        }
      } catch { /* best effort */ }
    }, 1000);
  }

  // Fire-and-forget thumbnail capture after publish
  setTimeout(async () => {
    try {
      const { captureScreenshot } = await import('@/lib/thumbnail');
      const siteUrl = `${process.env.NEXTAUTH_URL || 'https://thatcode.dev'}/p/${slug}`;
      const thumbnail = await captureScreenshot(siteUrl);
      if (thumbnail) {
        await prisma.project.update({ where: { id }, data: { thumbnail } }).catch(() => {});
      }
    } catch { /* best effort */ }
  }, 3000);

  return NextResponse.json({ url, customDomain, slug, vercelCname, domainError, functionsUrl });
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
