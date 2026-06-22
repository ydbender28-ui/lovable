import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAID_PLANS = ["pro", "team", "owner"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { isPrivate } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!PAID_PLANS.includes(user?.plan ?? "")) {
    return NextResponse.json({ error: "Private projects require a paid plan" }, { status: 403 });
  }

  const project = await prisma.project.updateMany({
    where: { id, ownerId: session.user.id },
    data: { isPrivate: Boolean(isPrivate) },
  });

  if (project.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, isPrivate: Boolean(isPrivate) });
}
