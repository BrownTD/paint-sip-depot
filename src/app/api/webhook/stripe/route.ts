import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  sendAdminOrderCreatedEmail,
  sendHostOrderCreatedEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAbsoluteUrl } from "@/lib/utils";
import Stripe from "stripe";

const BOOKING_STATUS = {
  pending: "PENDING",
  reserved: "RESERVED",
  paid: "PAID",
  expired: "EXPIRED",
  refunded: "REFUNDED",
} as const;

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
          const updateResult = await prisma.booking.updateMany({
            where: {
              stripeCheckoutSessionId: session.id,
              status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.reserved] },
            },
            data: {
              status: BOOKING_STATUS.paid,
              stripePaymentIntentId: session.payment_intent as string,
              reservationExpiresAt: null,
            },
          });

          if (updateResult.count > 0) {
            const booking = await prisma.booking.findFirst({
              where: { stripeCheckoutSessionId: session.id },
              include: {
                event: {
                  include: {
                    host: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            });

            if (booking) {
              const eventUrl = getAbsoluteUrl(`/e/${booking.event.slug}`);

              const notifications = [
                sendAdminOrderCreatedEmail({
                  recipientName: "Admin",
                  eventTitle: booking.event.title,
                  eventUrl,
                  startDateTime: booking.event.startDateTime,
                  locationName: booking.event.locationName,
                  quantity: booking.quantity,
                  purchaserName: booking.purchaserName,
                  purchaserEmail: booking.purchaserEmail,
                  amountPaidCents: booking.amountPaidCents,
                }),
              ];

              if (booking.event.host.email) {
                notifications.push(
                  sendHostOrderCreatedEmail({
                    to: booking.event.host.email,
                    recipientName: booking.event.host.name,
                    eventTitle: booking.event.title,
                    eventUrl,
                    startDateTime: booking.event.startDateTime,
                    locationName: booking.event.locationName,
                    quantity: booking.quantity,
                    purchaserName: booking.purchaserName,
                    purchaserEmail: booking.purchaserEmail,
                    amountPaidCents: booking.amountPaidCents,
                  })
                );
              }

              const results = await Promise.allSettled(notifications);
              const rejected = results.filter((result) => result.status === "rejected");
              if (rejected.length > 0) {
                console.error("Order notification email failed:", rejected);
              }
            }
          }

          console.log(`Booking confirmed for session: ${session.id}`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await prisma.booking.updateMany({
          where: {
            stripeCheckoutSessionId: session.id,
            status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.reserved] },
          },
          data: { status: BOOKING_STATUS.expired },
        });
        console.log(`Booking expired (session expired): ${session.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        await prisma.booking.updateMany({
          where: { stripePaymentIntentId: paymentIntentId, status: BOOKING_STATUS.paid },
          data: { status: BOOKING_STATUS.refunded },
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
