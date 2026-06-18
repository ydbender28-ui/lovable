import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  await prisma.agent.updateMany({
    where: { id, ownerId: session.user.id },
    data: { knowledge: JSON.stringify(body) },
  });
  return NextResponse.json({ ok: true });
}
