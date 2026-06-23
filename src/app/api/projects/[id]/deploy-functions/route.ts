import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt, isEncrypted } from "@/lib/crypto";

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/deploy-functions">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { functions } = await req.json() as { functions: Record<string, string> };

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.supabaseProjectId) {
    return NextResponse.json({ error: "No Supabase project. Enable database first." }, { status: 400 });
  }

  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  if (!token) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  // Get project's env vars to inject as secrets
  let secrets: Record<string, string> = {};
  if (project.envVars) {
    const raw = project.envVars;
    secrets = JSON.parse(isEncrypted(raw) ? decrypt(raw) : raw);
  }

  const ref = project.supabaseProjectId;
  const results: Array<{ name: string; ok: boolean; error?: string }> = [];

  for (const [name, code] of Object.entries(functions)) {
    try {
      // Deploy edge function via Supabase Management API
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${ref}/functions/${name}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            body: code,
            verify_jwt: false, // Allow public access
          }),
        }
      );

      if (!res.ok) {
        // Try updating if it already exists
        const updateRes = await fetch(
          `https://api.supabase.com/v1/projects/${ref}/functions/${name}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ body: code, verify_jwt: false }),
          }
        );
        if (!updateRes.ok) {
          const err = await updateRes.json().catch(() => ({}));
          results.push({ name, ok: false, error: err.message ?? "Deploy failed" });
          continue;
        }
      }

      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, error: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  // Set secrets on the Supabase project
  if (Object.keys(secrets).length > 0) {
    try {
      await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          Object.entries(secrets).map(([name, value]) => ({ name, value }))
        ),
      });
    } catch { /* best effort */ }
  }

  const functionsUrl = `https://${ref}.supabase.co/functions/v1`;
  return NextResponse.json({ results, functionsUrl });
}
