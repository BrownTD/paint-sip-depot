import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ShopOrderStatus } from "@prisma/client";
import {
  sendAdminOrderCreatedEmail,
  sendHostOrderCreatedEmail,
  sendShopExpiredCheckoutEmail,
} from "@/lib/email";
import { expireBookingsForCheckoutSession } from "@/lib/booking";
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
          if (
            session.metadata?.checkoutType === "SHOP_PRODUCT" ||
            session.metadata?.checkoutType === "SHOP_CART"
          ) {
            const shopOrderId = session.metadata.shopOrderId;
            if (!shopOrderId) {
              break;
            }

            await prisma.shopOrder.updateMany({
              where: {
                id: shopOrderId,
                status: ShopOrderStatus.PENDING,
              },
              data: {
                status: ShopOrderStatus.PAID,
                stripePaymentIntentId: session.payment_intent as string,
              },
            });

            break;
          }

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
              const eventUrl =
                booking.event.visibility === "PRIVATE" && booking.event.eventCode
                  ? getAbsoluteUrl(`/e/${booking.event.slug}?code=${encodeURIComponent(booking.event.eventCode)}`)
                  : getAbsoluteUrl(`/e/${booking.event.slug}`);
              const previewUrl = getAbsoluteUrl(`/dashboard/events/${booking.event.id}/preview`);

              const notifications = [
                sendAdminOrderCreatedEmail({
                  recipientName: "Admin",
                  organizerName: booking.event.host.name,
                  organizerEmail: booking.event.host.email,
                  bookingId: booking.id,
                  purchasedAt: booking.createdAt,
                  eventTitle: booking.event.title,
                  eventUrl,
                  previewUrl,
                  startDateTime: booking.event.startDateTime,
                  locationName: booking.event.locationName,
                  address: booking.event.address,
                  city: booking.event.city,
                  state: booking.event.state,
                  zip: booking.event.zip,
                  visibility: booking.event.visibility,
                  eventCode: booking.event.eventCode,
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
                    previewUrl,
                    startDateTime: booking.event.startDateTime,
                    locationName: booking.event.locationName,
                    visibility: booking.event.visibility,
                    eventCode: booking.event.eventCode,
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
        if (
          session.metadata?.checkoutType === "SHOP_PRODUCT" ||
          session.metadata?.checkoutType === "SHOP_CART"
        ) {
          const updateResult = await prisma.shopOrder.updateMany({
            where: {
              stripeCheckoutSessionId: session.id,
              status: ShopOrderStatus.PENDING,
            },
            data: {
              status: ShopOrderStatus.EXPIRED,
            },
          });

          if (updateResult.count > 0) {
            const shopOrder = await prisma.shopOrder.findFirst({
              where: { stripeCheckoutSessionId: session.id },
              include: {
                items: {
                  orderBy: { createdAt: "asc" },
                },
              },
            });

            if (shopOrder) {
              await sendShopExpiredCheckoutEmail({
                to: shopOrder.customerEmail,
                customerName: shopOrder.customerName,
                orderId: shopOrder.id,
                shopUrl: getAbsoluteUrl("/shop"),
                items: shopOrder.items.map((item) => ({
                  productName: item.productNameSnapshot,
                  variantLabel: item.variantLabelSnapshot,
                  quantity: item.quantity,
                })),
              }).catch((emailError: unknown) => {
                console.error("Shop expired checkout email failed:", {
                  shopOrderId: shopOrder.id,
                  sessionId: session.id,
                  error: emailError instanceof Error ? emailError.message : String(emailError),
                });
              });
            }
          }
          break;
        }

        await expireBookingsForCheckoutSession(prisma, session.id);
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
        await prisma.shopOrder.updateMany({
          where: { stripePaymentIntentId: paymentIntentId, status: ShopOrderStatus.PAID },
          data: { status: ShopOrderStatus.REFUNDED },
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
