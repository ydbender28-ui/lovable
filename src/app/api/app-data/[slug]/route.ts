import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple key-value store for published apps.
// Data is stored as JSON on the Project row (appData field).
// No auth required — scoped by publishSlug which is a secret random string.

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  const project = await prisma.project.findUnique({
    where: { publishSlug: slug },
    select: { appData: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const store: Record<string, unknown> = project.appData ? JSON.parse(project.appData) : {};
  if (key) return NextResponse.json({ value: store[key] ?? null });
  return NextResponse.json({ store });
}

export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { publishSlug: slug },
    select: { id: true, appData: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const store: Record<string, unknown> = project.appData ? JSON.parse(project.appData) : {};
  store[key] = value;

  await prisma.project.update({
    where: { id: project.id },
    data: { appData: JSON.stringify(store) },
  });

  return NextResponse.json({ ok: true });
}
