import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt, isEncrypted } from "@/lib/crypto";

export async function POST(req: Request) {
  const { projectId, items, successUrl, cancelUrl } = await req.json();

  if (!projectId || !items) {
    return NextResponse.json({ error: "projectId and items required" }, { status: 400 });
  }

  // Load the project's Stripe secret key from encrypted env vars
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project?.envVars) {
    return NextResponse.json({ error: "No API keys configured for this project" }, { status: 400 });
  }

  const raw = project.envVars;
  const env = JSON.parse(isEncrypted(raw) ? decrypt(raw) : raw);
  const stripeKey = env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 400 });
  }

  try {
    // Use Stripe API directly — no SDK needed
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        success_url: successUrl || `${req.headers.get("origin") || "https://thatcode.dev"}?success=true`,
        cancel_url: cancelUrl || `${req.headers.get("origin") || "https://thatcode.dev"}?canceled=true`,
        ...Object.fromEntries(
          items.flatMap((item: { name: string; price: number; quantity?: number }, i: number) => [
            [`line_items[${i}][price_data][currency]`, "usd"],
            [`line_items[${i}][price_data][product_data][name]`, item.name],
            [`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100))],
            [`line_items[${i}][quantity]`, String(item.quantity || 1)],
          ])
        ),
      }),
    });

    const session = await res.json();
    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 400 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
