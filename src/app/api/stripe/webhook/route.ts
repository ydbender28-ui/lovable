import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs â†’ internal plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ?? "__unset__"]: "plus",
  [process.env.STRIPE_PLUS_ANNUAL_PRICE_ID ?? "__unset2__"]: "plus",
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "__unset3__"]: "pro",
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "__unset4__"]: "pro",
  [process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "__unset5__"]: "business",
  [process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID ?? "__unset6__"]: "business",
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook signature verification failed: ${msg}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      // Resolve plan name from the line items if not in metadata
      const resolvedPlan = plan;
      await prisma.user.update({
        where: { id: userId },
        data: { plan: resolvedPlan },
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id;
    const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? "free") : "free";

    // Look up user by stripeCustomerId
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { plan },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { plan: "free" },
    });
  }

  return new Response("OK", { status: 200 });
}

