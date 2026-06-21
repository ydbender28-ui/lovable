import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPABASE_MGMT = "https://api.supabase.com/v1";

async function supabaseApi(path: string, method = "GET", body?: unknown) {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  if (!token) throw new Error("SUPABASE_MANAGEMENT_TOKEN not configured");
  const res = await fetch(`${SUPABASE_MGMT}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Supabase API error ${res.status}`);
  }
  return res.json();
}

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]/supabase">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    enabled: !!project.supabaseProjectId,
    url: project.supabaseUrl,
    anonKey: project.supabaseAnonKey,
  });
}

export async function POST(_req: Request, ctx: RouteContext<"/api/projects/[id]/supabase">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already provisioned
  if (project.supabaseProjectId) {
    return NextResponse.json({ url: project.supabaseUrl, anonKey: project.supabaseAnonKey, existing: true });
  }

  const orgId = process.env.SUPABASE_ORG_ID;
  if (!orgId) return NextResponse.json({ error: "SUPABASE_ORG_ID not configured" }, { status: 503 });

  try {
    // Create a new Supabase project
    const slug = `tc-${id.slice(0, 12).toLowerCase()}`;
    const dbPass = `Tc${Math.random().toString(36).slice(2, 10)}!${Math.random().toString(36).slice(2, 6)}`;
    const created = await supabaseApi("/projects", "POST", {
      name: project.name.slice(0, 60),
      organization_id: orgId,
      db_pass: dbPass,
      region: "us-east-1",
      plan: "free",
    });

    // Wait for project to be ready (poll up to 2 min)
    let ref = created.id;
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const status = await supabaseApi(`/projects/${ref}`);
      if (status.status === "ACTIVE_HEALTHY") break;
    }

    // Get API keys
    const keys = await supabaseApi(`/projects/${ref}/api-keys`);
    const anonKey = keys.find((k: { name: string; api_key: string }) => k.name === "anon")?.api_key;
    const url = `https://${ref}.supabase.co`;

    await prisma.project.update({
      where: { id },
      data: { supabaseProjectId: ref, supabaseUrl: url, supabaseAnonKey: anonKey },
    });

    return NextResponse.json({ url, anonKey, ref });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to provision database" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]/supabase">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project?.supabaseProjectId) return NextResponse.json({ ok: true });
  try {
    await supabaseApi(`/projects/${project.supabaseProjectId}`, "DELETE");
  } catch { /* ignore — best effort */ }
  await prisma.project.update({ where: { id }, data: { supabaseProjectId: null, supabaseUrl: null, supabaseAnonKey: null } });
  return NextResponse.json({ ok: true });
}
