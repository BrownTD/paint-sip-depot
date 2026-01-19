import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { bookingSchema } from "@/lib/validations";
import { isSalesCutoffPassed, getAbsoluteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { eventId, quantity, purchaserName, purchaserEmail } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { bookings: { where: { status: "PAID" } } } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This event is not available for booking" },
        { status: 400 }
      );
    }

    if (isSalesCutoffPassed(event.startDateTime, event.salesCutoffHours)) {
      return NextResponse.json(
        { error: "Ticket sales have ended for this event" },
        { status: 400 }
      );
    }

    const totalSold = event._count.bookings;
    const ticketsRemaining = event.capacity - totalSold;

    if (quantity > ticketsRemaining) {
      return NextResponse.json(
        { error: `Only ${ticketsRemaining} ticket${ticketsRemaining !== 1 ? "s" : ""} remaining` },
        { status: 400 }
      );
    }

    const amountCents = event.ticketPriceCents * quantity;

    const booking = await prisma.booking.create({
      data: {
        eventId,
        purchaserName,
        purchaserEmail,
        quantity,
        amountPaidCents: amountCents,
        status: "PENDING",
      },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: event.title,
              description: `${quantity} ticket${quantity > 1 ? "s" : ""} for ${event.title}`,
              images: event.canvasImageUrl ? [event.canvasImageUrl] : [],
            },
            unit_amount: event.ticketPriceCents,
          },
          quantity,
        },
      ],
      customer_email: purchaserEmail,
      metadata: { bookingId: booking.id, eventId: event.id, purchaserName },
      success_url: getAbsoluteUrl(`/booking/success?session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: getAbsoluteUrl(`/e/${event.slug}?canceled=true`),
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeCheckoutSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}