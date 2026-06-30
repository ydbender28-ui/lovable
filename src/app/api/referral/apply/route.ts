import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REFERRAL_CREDITS } from "@/lib/referral";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { referralCode } = await req.json();
  if (!referralCode) return Response.json({ error: "Code required" }, { status: 400 });

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referredBy: true, credits: true },
  });

  if (currentUser?.referredBy) {
    return Response.json({ error: "Already applied a referral code" }, { status: 400 });
  }

  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  if (!referrer) return Response.json({ error: "Invalid referral code" }, { status: 404 });
  if (referrer.id === session.user.id) return Response.json({ error: "Cannot refer yourself" }, { status: 400 });

  await Promise.all([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: { increment: REFERRAL_CREDITS.newUser },
        referredBy: referrer.id,
      },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: {
        credits: { increment: REFERRAL_CREDITS.referrer },
        referralCount: { increment: 1 },
      },
    }),
  ]);

  return Response.json({ success: true, creditsEarned: REFERRAL_CREDITS.newUser });
}
