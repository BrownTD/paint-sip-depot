// src/app/api/webhook/stripe-connect/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/STRIPE-CONNECT-PSD/server/webhook";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET_CONNECT;
  if (!secret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET_CONNECT env var");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await handleStripeEvent(event);
  return NextResponse.json({ received: true });
}