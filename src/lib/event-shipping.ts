import { BookingStatus, EventFulfillmentMethod, EventStatus, ShopOrderStatus } from "@prisma/client";
import { areBookingsClosed } from "@/lib/booking";
import { sendHostEventShippingPreparedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  buildShippoEventHostAddress,
  createShippoOrder,
  getKitParcelSummary,
  getShippoUspsRateQuote,
} from "@/lib/shippo";
import { getAbsoluteUrl } from "@/lib/utils";

export async function createEventShippingOrderForEvent(eventId: string, now = new Date()) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      host: { select: { name: true, email: true } },
      shippingOrder: true,
      bookings: {
        where: { status: BookingStatus.PAID },
        select: {
          id: true,
          quantity: true,
          amountPaidCents: true,
        },
      },
    },
  });

  if (!event) {
    return { status: "not_found" as const, shippingOrder: null };
  }

  if (event.shippingOrder) {
    return { status: "exists" as const, shippingOrder: event.shippingOrder };
  }

  if (event.status !== EventStatus.PUBLISHED) {
    return { status: "event_not_published" as const, shippingOrder: null };
  }

  if (event.fulfillmentMethod === EventFulfillmentMethod.PICKUP) {
    return { status: "pickup" as const, shippingOrder: null };
  }

  if (!areBookingsClosed(event.startDateTime, now, event.bookingCutoffOverrideAt)) {
    return { status: "cutoff_open" as const, shippingOrder: null };
  }

  const totalKits = event.bookings.reduce((sum, booking) => sum + booking.quantity, 0);
  if (totalKits <= 0) {
    return { status: "no_paid_bookings" as const, shippingOrder: null };
  }

  const paidBookingCount = event.bookings.length;
  const amountSubtotalCents = event.bookings.reduce((sum, booking) => sum + booking.amountPaidCents, 0);
  const toAddress = buildShippoEventHostAddress({
    shippingRecipientName: event.shippingRecipientName,
    shippingAddress: event.shippingAddress,
    shippingCity: event.shippingCity,
    shippingState: event.shippingState,
    shippingZip: event.shippingZip,
    hostEmail: event.host.email,
  });
  const shippingQuote = await getShippoUspsRateQuote({
    toAddress,
    quantity: totalKits,
    metadata: `Event shipping ${event.id}`,
  });
  const shippoOrder = await createShippoOrder({
    toAddress,
    lineItems: [
      {
        quantity: totalKits,
        title: `${event.title} event kits`,
        total_price: (amountSubtotalCents / 100).toFixed(2),
        currency: "USD",
        weight: "2",
        weight_unit: "lb",
      },
    ],
    placedAt: now,
    orderNumber: `event-${event.id}`,
    subtotalCents: amountSubtotalCents,
    totalCents: amountSubtotalCents + shippingQuote.amountCents,
    shippingAmountCents: shippingQuote.amountCents,
    shippingMethod: [shippingQuote.provider, shippingQuote.service].filter(Boolean).join(" "),
    notes: getKitParcelSummary(totalKits),
    currency: "usd",
  });

  const shippingOrder = await prisma.eventShippingOrder.create({
    data: {
      eventId: event.id,
      hostName: event.host.name,
      hostEmail: event.host.email,
      shippingName: event.shippingRecipientName,
      shippingAddress: event.shippingAddress,
      shippingCity: event.shippingCity,
      shippingState: event.shippingState,
      shippingZip: event.shippingZip,
      totalKits,
      paidBookingCount,
      shippingAmountCents: shippingQuote.amountCents,
      shippingProvider: shippingQuote.provider,
      shippingService: shippingQuote.service,
      shippingEstimatedDays: shippingQuote.estimatedDays,
      shippingArrivesBy: shippingQuote.arrivesBy,
      shippingEstimateLabel: shippingQuote.estimateLabel,
      shippoShipmentId: shippingQuote.shipmentId,
      shippoRateId: shippingQuote.rateId,
      shippoOrderId: shippoOrder.shippoOrderId,
      shippoOrderStatus: shippoOrder.shippoOrderStatus,
      status: ShopOrderStatus.PAID,
      preparedEmailSentAt: event.host.email ? now : null,
    },
  });

  if (event.host.email) {
    await sendHostEventShippingPreparedEmail({
      to: event.host.email,
      recipientName: event.host.name,
      eventTitle: event.title,
      eventUrl: getAbsoluteUrl(`/e/${event.slug}`),
      startDateTime: event.startDateTime,
      locationName: event.locationName,
      totalKits,
      paidBookingCount,
      shippingName: event.shippingRecipientName,
      shippingAddress: event.shippingAddress,
      shippingCity: event.shippingCity,
      shippingState: event.shippingState,
      shippingZip: event.shippingZip,
      shippingAmountCents: shippingQuote.amountCents,
      shippingProvider: shippingQuote.provider,
      shippingService: shippingQuote.service,
    }).catch((error: unknown) => {
      console.error("Event shipping prepared email failed:", {
        eventId: event.id,
        eventShippingOrderId: shippingOrder.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return { status: "created" as const, shippingOrder };
}

export async function createDueEventShippingOrders(now = new Date()) {
  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      fulfillmentMethod: EventFulfillmentMethod.SHIP_TO_HOST,
      shippingOrder: null,
    },
    select: {
      id: true,
      startDateTime: true,
      bookingCutoffOverrideAt: true,
    },
  });

  const dueEvents = events.filter((event) =>
    areBookingsClosed(event.startDateTime, now, event.bookingCutoffOverrideAt),
  );
  const results = [];

  for (const event of dueEvents) {
    results.push(await createEventShippingOrderForEvent(event.id, now));
  }

  return results;
}
