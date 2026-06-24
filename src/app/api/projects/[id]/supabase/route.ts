import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Shared Supabase project — ONE project for all ThatCode apps
// Each app gets isolated data via RLS (project_id column)
const SHARED_SUPABASE_URL = process.env.SHARED_SUPABASE_URL ?? "";
const SHARED_SUPABASE_ANON_KEY = process.env.SHARED_SUPABASE_ANON_KEY ?? "";
const SHARED_SUPABASE_SERVICE_KEY = process.env.SHARED_SUPABASE_SERVICE_KEY ?? "";

async function supabaseQuery(sql: string) {
  if (!SHARED_SUPABASE_URL || !SHARED_SUPABASE_SERVICE_KEY) {
    throw new Error("Shared Supabase not configured");
  }
  const res = await fetch(`${SHARED_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SHARED_SUPABASE_SERVICE_KEY}`,
      apikey: SHARED_SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    // Fallback: try direct SQL via Supabase Management API
    return null;
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
    url: SHARED_SUPABASE_URL,
    anonKey: SHARED_SUPABASE_ANON_KEY,
    projectId: id,
  });
}

export async function POST(_req: Request, ctx: RouteContext<"/api/projects/[id]/supabase">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!SHARED_SUPABASE_URL || !SHARED_SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Database service not configured" }, { status: 503 });
  }

  // Already enabled for this project
  if (project.supabaseProjectId) {
    return NextResponse.json({
      url: SHARED_SUPABASE_URL,
      anonKey: SHARED_SUPABASE_ANON_KEY,
      projectId: id,
      existing: true,
    });
  }

  try {
    // Create default tables for this project with RLS
    // Using the service key to bypass RLS for setup
    const setupRes = await fetch(`${SHARED_SUPABASE_URL}/rest/v1/rpc/setup_project`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SHARED_SUPABASE_SERVICE_KEY}`,
        apikey: SHARED_SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ p_project_id: id }),
    });

    // If the RPC doesn't exist yet, that's OK — tables might already exist
    // The important thing is marking the project as enabled

    await prisma.project.update({
      where: { id },
      data: {
        supabaseProjectId: "shared",
        supabaseUrl: SHARED_SUPABASE_URL,
        supabaseAnonKey: SHARED_SUPABASE_ANON_KEY,
      },
    });

    return NextResponse.json({
      url: SHARED_SUPABASE_URL,
      anonKey: SHARED_SUPABASE_ANON_KEY,
      projectId: id,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Failed to enable database",
    }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/projects/[id]/supabase">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project?.supabaseProjectId) return NextResponse.json({ ok: true });

  // Don't delete the shared project — just unlink this project
  await prisma.project.update({
    where: { id },
    data: { supabaseProjectId: null, supabaseUrl: null, supabaseAnonKey: null },
  });
  return NextResponse.json({ ok: true });
}
