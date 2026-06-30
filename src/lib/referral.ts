import { prisma } from "@/lib/prisma";

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;

  let code: string = '';
  let attempts = 0;
  do {
    code = generateReferralCode();
    attempts++;
  } while (attempts < 10 && await prisma.user.findUnique({ where: { referralCode: code } }));

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

export const REFERRAL_CREDITS = {
  referrer: 5,   // credits the person who shared gets
  newUser: 3,    // bonus credits the new user gets
};
