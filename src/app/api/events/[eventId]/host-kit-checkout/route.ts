import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  areBookingsClosed,
  expireStaleReservations,
  getRemainingTickets,
  getReservationExpiry,
} from "@/lib/booking";
import { getCheckoutTotalCents } from "@/lib/checkout-pricing";
import { hasHostPurchasedEventKit } from "@/lib/host-kit";
import { prisma } from "@/lib/prisma";
import { buildShippoEventHostAddress, getShippoUspsRateQuote } from "@/lib/shippo";
import { stripe } from "@/lib/stripe";
import { normalizeEmail } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

class HostKitCheckoutError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

function getAbsoluteRequestUrl(request: Request, path: string) {
  return new URL(path, getRequestOrigin(request)).toString();
}

function getCheckoutImageUrl(request: Request, imageUrl: string | null) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/")) return getAbsoluteRequestUrl(request, imageUrl);
  return imageUrl;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      throw new HostKitCheckoutError("You must be signed in to buy your host kit.", 401);
    }

    const { eventId } = await context.params;
    const now = new Date();
    const reservationExpiresAt = getReservationExpiry(now);
    const hostEmail = normalizeEmail(session.user.email);

    await expireStaleReservations(prisma, now, eventId);

    const { booking, event } = await prisma.$transaction(
      async (tx) => {
        const eventRecord = await tx.event.findUnique({ where: { id: eventId } });
        if (!eventRecord || eventRecord.hostId !== session.user.id) {
          throw new HostKitCheckoutError("Event not found.", 404);
        }
        if (eventRecord.status !== "PUBLISHED") {
          throw new HostKitCheckoutError("This event is not active yet.", 400);
        }
        if (areBookingsClosed(eventRecord.startDateTime, now, eventRecord.bookingCutoffOverrideAt)) {
          throw new HostKitCheckoutError("Checkout has already closed for this event.", 400);
        }
        if (await hasHostPurchasedEventKit(eventRecord.id, hostEmail)) {
          throw new HostKitCheckoutError("You already bought your kit for this event.", 409);
        }

        const availability = await getRemainingTickets(tx, eventRecord.id, eventRecord.capacity, now);
        if (availability.remaining < 1) {
          throw new HostKitCheckoutError("This event is sold out.", 409);
        }

        const pricing = getCheckoutTotalCents(eventRecord.ticketPriceCents, 1, {
          includeShipping: false,
        });
        const bookingRecord = await tx.booking.create({
          data: {
            eventId: eventRecord.id,
            purchaserName: session.user.name || "Event host",
            purchaserEmail: hostEmail,
            quantity: 1,
            amountPaidCents: pricing.totalCents,
            status: "RESERVED",
            reservationExpiresAt,
          },
        });

        return { booking: bookingRecord, event: eventRecord };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    try {
      let shippingFeeCents = 0;
      let shippingQuote: Awaited<ReturnType<typeof getShippoUspsRateQuote>> | null = null;
      if (event.fulfillmentMethod !== "PICKUP") {
        shippingQuote = await getShippoUspsRateQuote({
          toAddress: buildShippoEventHostAddress({
            shippingRecipientName: event.shippingRecipientName,
            shippingAddress: event.shippingAddress,
            shippingCity: event.shippingCity,
            shippingState: event.shippingState,
            shippingZip: event.shippingZip,
            hostEmail,
          }),
          quantity: 1,
          metadata: `Host kit checkout ${booking.id} event ${event.id}`,
        });
        shippingFeeCents = shippingQuote.amountCents;
      }

      const pricing = getCheckoutTotalCents(event.ticketPriceCents, 1, { includeShipping: false });
      const imageUrl = getCheckoutImageUrl(request, event.canvasImageUrl);
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${event.title} Host Kit`,
                description: `Your host kit for ${event.title}`,
                tax_code: "txcd_99999999",
                images: imageUrl ? [imageUrl] : [],
              },
              unit_amount: event.ticketPriceCents,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Processing Fee",
                description: "Stripe payment processing fee",
                tax_code: "txcd_99999999",
              },
              unit_amount: pricing.processingFeeCents,
            },
            quantity: 1,
          },
          ...(shippingFeeCents > 0
            ? [
                {
                  price_data: {
                    currency: "usd",
                    product_data: {
                      name: `${shippingQuote?.provider ?? "USPS"} Event Kit Shipping`,
                      description: shippingQuote?.service ?? "USPS",
                      tax_code: "txcd_00000000",
                    },
                    unit_amount: shippingFeeCents,
                  },
                  quantity: 1,
                },
              ]
            : []),
        ],
        customer_email: hostEmail,
        metadata: {
          bookingId: booking.id,
          eventId: event.id,
          checkoutType: "HOST_EVENT_KIT",
        },
        success_url: getAbsoluteRequestUrl(request, `/booking/success?session_id={CHECKOUT_SESSION_ID}`),
        cancel_url: getAbsoluteRequestUrl(request, "/dashboard"),
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          stripeCheckoutSessionId: checkoutSession.id,
          amountPaidCents: pricing.totalCents + shippingFeeCents,
          shippingAmountCents: shippingFeeCents,
          shippingProvider: shippingQuote?.provider,
          shippingService: shippingQuote?.service,
          shippoShipmentId: shippingQuote?.shipmentId,
          shippoRateId: shippingQuote?.rateId,
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
      await prisma.booking.deleteMany({
        where: {
          id: booking.id,
          status: "RESERVED",
          stripeCheckoutSessionId: null,
        },
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof HostKitCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Host kit checkout error:", error);
    return NextResponse.json({ error: "Could not start host kit checkout." }, { status: 500 });
  }
}
