import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "ydbender28@gmail.com";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.email !== OWNER_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, credits } = await req.json();
  if (!email || !credits) return NextResponse.json({ error: "email and credits required" }, { status: 400 });

  const user = await prisma.user.update({
    where: { email },
    data: { credits: { increment: Number(credits) } },
    select: { email: true, credits: true },
  });

  return NextResponse.json({ ok: true, user });
}
