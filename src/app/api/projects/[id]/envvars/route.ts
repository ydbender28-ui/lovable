import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";

export async function GET(_req: Request, ctx: RouteContext<"/api/projects/[id]/envvars">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = project.envVars ?? "{}";
  const json = isEncrypted(raw) ? decrypt(raw) : raw;
  return NextResponse.json(JSON.parse(json));
}

export async function PUT(req: Request, ctx: RouteContext<"/api/projects/[id]/envvars">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  if (typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { id, ownerId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const encrypted = encrypt(JSON.stringify(body));
  await prisma.project.update({ where: { id }, data: { envVars: encrypted } });
  return NextResponse.json(body);
}

export async function POST(req: Request, ctx: RouteContext<"/api/projects/[id]/envvars">) {
  return PUT(req, ctx);
}
