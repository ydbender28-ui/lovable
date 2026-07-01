import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

const PRICE_IDS: Record<string, string> = {
  plus_monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ?? "",
  plus_annual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID ?? "",
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
  business_monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "",
  business_annual: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID ?? "",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { plan, interval = "monthly" } = await req.json();
  const priceKey = `${plan}_${interval}`;
  const priceId = PRICE_IDS[priceKey];

  if (!priceId) {
    return new Response(
      JSON.stringify({ error: `Invalid plan or price ID not configured for "${priceKey}"` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { email: true, stripeCustomerId: true },
  });

  let customerId = user?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      metadata: { userId: (session.user as { id: string }).id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { userId: (session.user as { id: string }).id, plan },
  });

  return Response.json({ url: checkoutSession.url });
}

