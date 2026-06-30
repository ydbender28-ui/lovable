import { auth } from "@/lib/auth";
import { getOrCreateReferralCode } from "@/lib/referral";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const code = await getOrCreateReferralCode(session.user.id);
  const baseUrl = process.env.NEXTAUTH_URL || 'https://thatcode.dev';
  return Response.json({ code, link: `${baseUrl}/signup?ref=${code}` });
}
