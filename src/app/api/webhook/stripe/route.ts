import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await prisma.booking.update({
            where: { stripeCheckoutSessionId: session.id },
            data: {
              status: "PAID",
              stripePaymentIntentId: session.payment_intent as string,
            },
          });
          console.log(`Booking confirmed for session: ${session.id}`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await prisma.booking.updateMany({
          where: { stripeCheckoutSessionId: session.id, status: "PENDING" },
          data: { status: "CANCELED" },
        });
        console.log(`Booking canceled (session expired): ${session.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        await prisma.booking.updateMany({
          where: { stripePaymentIntentId: paymentIntentId, status: "PAID" },
          data: { status: "REFUNDED" },
        });
        console.log(`Booking refunded for payment intent: ${paymentIntentId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}