import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (sig && webhookSecret) {
    // Classic webhook with signature verification
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (e) {
      console.error("Webhook signature failed:", e);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // No signature — parse raw JSON (Event Destinations / test mode)
    // Only allow this if no webhook secret is configured
    if (webhookSecret) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  console.log("Stripe webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, credits } = session.metadata ?? {};

    console.log("Payment completed — userId:", userId, "credits:", credits);

    if (!userId || !credits) {
      console.error("Missing metadata on checkout session");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: Number(credits) } },
    });

    console.log(`Added ${credits} credits to user ${userId}`);
  }

  return NextResponse.json({ ok: true });
}
