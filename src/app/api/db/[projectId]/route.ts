import { NextResponse } from "next/server";

// Proxy to shared Supabase — adds project_id to every query
// Published apps call this instead of Supabase directly
const SUPABASE_URL = process.env.SHARED_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SHARED_SUPABASE_SERVICE_KEY ?? "";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const url = new URL(req.url);
  const table = url.searchParams.get("table") ?? "items";
  const type = url.searchParams.get("type");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let query = `${SUPABASE_URL}/rest/v1/${table}?project_id=eq.${projectId}&order=sort_order.asc`;
  if (type) query += `&type=eq.${type}`;

  const res = await fetch(query, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const body = await req.json();
  const { table = "items", data } = body;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Inject project_id into every row
  const rows = Array.isArray(data) ? data : [data];
  const withProjectId = rows.map(r => ({ ...r, project_id: projectId }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(withProjectId),
  });

  const result = await res.json();
  return NextResponse.json(result, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const url = new URL(req.url);
  const table = url.searchParams.get("table") ?? "items";
  const id = url.searchParams.get("id");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !id) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&project_id=eq.${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
    },
  });

  return NextResponse.json({ ok: true }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
