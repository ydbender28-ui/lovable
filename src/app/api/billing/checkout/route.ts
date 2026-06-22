import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-05-28.basil" });

// Credit packages — price in cents, credits granted after payment
export const CREDIT_PACKAGES = [
  { id: "starter",  credits: 100,  priceUsd: 500,  label: "Starter",  description: "100 credits" },
  { id: "builder",  credits: 300,  priceUsd: 1200, label: "Builder",  description: "300 credits" },
  { id: "pro",      credits: 700,  priceUsd: 2500, label: "Pro",      description: "700 credits" },
  { id: "agency",   credits: 2000, priceUsd: 6000, label: "Agency",   description: "2,000 credits" },
] as const;

export type PackageId = typeof CREDIT_PACKAGES[number]["id"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packageId } = await req.json();
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

  const origin = req.headers.get("origin") ?? "https://thatcode.dev";

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pkg.priceUsd,
          product_data: {
            name: `ThatCode — ${pkg.label} Pack`,
            description: `${pkg.credits} credits for building apps with AI`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email ?? undefined,
    metadata: {
      userId: session.user.id,
      credits: String(pkg.credits),
      packageId: pkg.id,
    },
    success_url: `${origin}/dashboard?credits=purchased&package=${pkg.id}`,
    cancel_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: checkout.url });
}
