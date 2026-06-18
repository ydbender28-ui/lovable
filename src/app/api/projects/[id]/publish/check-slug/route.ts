import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const slug = toSlug(new URL(req.url).searchParams.get("slug") ?? "");
  if (!slug || slug.length < 2) return NextResponse.json({ available: false, error: "Too short" });

  const existing = await prisma.project.findUnique({ where: { publishSlug: slug } });
  const available = !existing || existing.id === id;
  return NextResponse.json({ available, slug });
}
