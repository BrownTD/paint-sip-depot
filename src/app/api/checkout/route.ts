import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  areBookingsClosed,
  expireStaleReservations,
  getRemainingTickets,
  getReservationExpiry,
} from "@/lib/booking";
import { getCheckoutTotalCents } from "@/lib/checkout-pricing";
import { bookingSchema } from "@/lib/validations";

class CheckoutError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const BOOKING_STATUS = {
  reserved: "RESERVED",
} as const;

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

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

async function reserveBookingForCheckout({
  eventId,
  quantity,
  purchaserName,
  purchaserEmail,
}: {
  eventId: string;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
}) {
  const now = new Date();
  const reservationExpiresAt = getReservationExpiry(now);

  // Stale reservations are expired before the inventory transaction starts so any
  // follow-up email work does not run inside the ticket reservation transaction.
  await expireStaleReservations(prisma, now, eventId);

  return prisma.$transaction(
    async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new CheckoutError("Event not found", 404);
      }

      if (event.status !== "PUBLISHED") {
        throw new CheckoutError("This event is not available for booking", 400);
      }

      if (areBookingsClosed(event.startDateTime, now, event.bookingCutoffOverrideAt)) {
        throw new CheckoutError("Bookings are closed for this event", 400);
      }

      const availability = await getRemainingTickets(tx, event.id, event.capacity, now);
      const pricing = getCheckoutTotalCents(event.ticketPriceCents, quantity, {
        includeShipping: event.fulfillmentMethod !== "PICKUP",
      });

      if (quantity > availability.remaining) {
        throw new CheckoutError(
          `Only ${availability.remaining} ticket${availability.remaining !== 1 ? "s" : ""} remaining`,
          409,
        );
      }

      const booking = await tx.booking.create({
        data: {
          eventId,
          purchaserName,
          purchaserEmail,
          quantity,
          amountPaidCents: pricing.totalCents,
          status: BOOKING_STATUS.reserved,
          reservationExpiresAt,
        },
      });

      return { booking, event, reservationExpiresAt };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

async function withReservationRetry(input: {
  eventId: string;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await reserveBookingForCheckout(input);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new CheckoutError("Could not reserve tickets. Please try again.", 409);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { eventId, quantity, purchaserName, purchaserEmail } = parsed.data;

    const { booking, event, reservationExpiresAt } = await withReservationRetry({
      eventId,
      quantity,
      purchaserName,
      purchaserEmail,
    });

    try {
      const cancelUrl =
        event.visibility === "PRIVATE" && event.eventCode
          ? getAbsoluteRequestUrl(
              request,
              `/e/${event.slug}?canceled=true&code=${encodeURIComponent(event.eventCode)}`
            )
          : getAbsoluteRequestUrl(request, `/e/${event.slug}?canceled=true`);

      const pricing = getCheckoutTotalCents(event.ticketPriceCents, quantity);
      const lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: event.title,
              description: `${quantity} ticket${quantity > 1 ? "s" : ""} for ${event.title}`,
              tax_code: "txcd_99999999",
              images: getCheckoutImageUrl(request, event.canvasImageUrl)
                ? [getCheckoutImageUrl(request, event.canvasImageUrl)!]
                : [],
            },
            unit_amount: event.ticketPriceCents,
          },
          quantity,
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
        ...(pricing.shippingFeeCents > 0
          ? [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: "Event Kit Shipping",
                    description: `Supplies ship to ${event.shippingRecipientName || "the host"} for this event`,
                    tax_code: "txcd_99999999",
                  },
                  unit_amount: pricing.shippingFeeCents,
                },
                quantity: 1,
              },
            ]
          : []),
      ];

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
        line_items: lineItems,
        customer_email: purchaserEmail,
        metadata: {
          bookingId: booking.id,
          eventId: event.id,
          purchaserName,
          shippingRecipientName: event.shippingRecipientName || "",
          shippingAddress: event.shippingAddress || "",
          shippingCity: event.shippingCity || "",
          shippingState: event.shippingState || "",
          shippingZip: event.shippingZip || "",
        },
        success_url: getAbsoluteRequestUrl(
          request,
          `/booking/success?session_id={CHECKOUT_SESSION_ID}`
        ),
        cancel_url: cancelUrl,
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          stripeCheckoutSessionId: checkoutSession.id,
          reservationExpiresAt,
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
      await prisma.booking.deleteMany({
        where: {
          id: booking.id,
          status: BOOKING_STATUS.reserved,
          stripeCheckoutSessionId: null,
        },
      });

      throw error;
    }
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
