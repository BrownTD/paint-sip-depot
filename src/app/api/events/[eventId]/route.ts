import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  sendAdminEventUpdatedEmail,
  sendEventUpdatedEmail,
} from "@/lib/email";
import { generateEventQrCode } from "@/lib/event-qr";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { resolveEventCodeForVisibility } from "@/lib/event-discovery";
import { formatDate, formatTime, getAbsoluteUrl } from "@/lib/utils";

const FIXED_TICKET_PRICE_CENTS = 3500;
const FIXED_REFUND_POLICY =
  "Refunds are not available within 7 days of the event due to preparation and supply costs.\n\nIf you are unable to attend, your pre-drawn canvas and materials can be shipped to you so you can still complete the painting at home. Shipping fees may apply.\n\nIf the event is canceled by the organizer, all pre-drawn canvases and materials will be shipped to guests so they can still complete the painting at home. Guests will be contacted with additional details if necessary.";

function formatEventDateTime(value: Date | null) {
  return value ? `${formatDate(value)} at ${formatTime(value)}` : "Not set";
}

function normalizeTextValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || "Not set";
}

function buildEventUpdateChanges(
  previous: {
    startDateTime: Date;
    endDateTime: Date | null;
    locationName: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  },
  next: {
    startDateTime: Date;
    endDateTime: Date | null;
    locationName: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  }
) {
  const changes: Array<{ label: string; previousValue: string; nextValue: string }> = [];

  if (previous.startDateTime.getTime() !== next.startDateTime.getTime()) {
    changes.push({
      label: "Date and time",
      previousValue: formatEventDateTime(previous.startDateTime),
      nextValue: formatEventDateTime(next.startDateTime),
    });
  }

  if ((previous.endDateTime?.getTime() || 0) !== (next.endDateTime?.getTime() || 0)) {
    changes.push({
      label: "End time",
      previousValue: formatEventDateTime(previous.endDateTime),
      nextValue: formatEventDateTime(next.endDateTime),
    });
  }

  const locationFields = [
    ["Location", previous.locationName, next.locationName],
    ["Address", previous.address, next.address],
    ["City", previous.city, next.city],
    ["State", previous.state, next.state],
    ["ZIP", previous.zip, next.zip],
  ] as const;

  for (const [label, previousValue, nextValue] of locationFields) {
    if (normalizeTextValue(previousValue) !== normalizeTextValue(nextValue)) {
      changes.push({
        label,
        previousValue: normalizeTextValue(previousValue),
        nextValue: normalizeTextValue(nextValue),
      });
    }
  }

  return changes;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId, hostId: session.user.id },
      include: {
        bookings: { where: { status: "PAID" } },
        _count: { select: { bookings: { where: { status: "PAID" } } } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, hostId: session.user.id },
      include: {
        host: { select: { name: true, email: true } },
        bookings: {
          where: { status: "PAID" },
          select: {
            purchaserName: true,
            purchaserEmail: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const allowedUpdates: Record<string, string[]> = {
      DRAFT: ["status", "title", "description", "startDateTime", "endDateTime", "locationName", "address", "city", "state", "zip", "shippingRecipientName", "shippingAddress", "shippingCity", "shippingState", "shippingZip", "fulfillmentMethod", "capacity", "salesCutoffHours", "canvasImageUrl", "canvasName", "visibility", "eventFormat"],
      PUBLISHED: ["status", "title", "description", "startDateTime", "endDateTime", "locationName", "address", "city", "state", "zip", "shippingRecipientName", "shippingAddress", "shippingCity", "shippingState", "shippingZip", "fulfillmentMethod", "capacity", "salesCutoffHours", "canvasImageUrl", "canvasName", "visibility", "eventFormat"],
      ENDED: ["status", "title", "description", "startDateTime", "endDateTime", "locationName", "address", "city", "state", "zip", "shippingRecipientName", "shippingAddress", "shippingCity", "shippingState", "shippingZip", "fulfillmentMethod", "capacity", "salesCutoffHours", "canvasImageUrl", "canvasName", "visibility", "eventFormat"],
      CANCELED: ["status", "title", "description", "startDateTime", "endDateTime", "locationName", "address", "city", "state", "zip", "shippingRecipientName", "shippingAddress", "shippingCity", "shippingState", "shippingZip", "fulfillmentMethod", "capacity", "salesCutoffHours", "canvasImageUrl", "canvasName", "visibility", "eventFormat"],
    };

    const allowed = allowedUpdates[existingEvent.status] || [];
    const requestedKeys = Object.keys(body);

    if (!(requestedKeys.length === 1 && requestedKeys[0] === "status")) {
      const parsed = eventSchema.safeParse({
        title: body.title ?? existingEvent.title,
        description: body.description ?? existingEvent.description ?? undefined,
        startDateTime: body.startDateTime
          ? new Date(body.startDateTime)
          : existingEvent.startDateTime,
        endDateTime: body.endDateTime
          ? new Date(body.endDateTime)
          : existingEvent.endDateTime ?? undefined,
        eventFormat: body.eventFormat ?? existingEvent.eventFormat,
        visibility: body.visibility ?? existingEvent.visibility,
        locationName: body.locationName ?? existingEvent.locationName,
        address: body.address ?? existingEvent.address ?? "",
        city: body.city ?? existingEvent.city ?? "",
        state: body.state ?? existingEvent.state ?? "",
        zip: body.zip ?? existingEvent.zip ?? "",
        shippingRecipientName: body.shippingRecipientName ?? existingEvent.shippingRecipientName ?? "",
        shippingAddress: body.shippingAddress ?? existingEvent.shippingAddress ?? "",
        shippingCity: body.shippingCity ?? existingEvent.shippingCity ?? "",
        shippingState: body.shippingState ?? existingEvent.shippingState ?? "",
        shippingZip: body.shippingZip ?? existingEvent.shippingZip ?? "",
        fulfillmentMethod: body.fulfillmentMethod ?? existingEvent.fulfillmentMethod ?? "SHIP_TO_HOST",
        ticketPriceCents: FIXED_TICKET_PRICE_CENTS,
        capacity: body.capacity ?? existingEvent.capacity,
        salesCutoffHours: body.salesCutoffHours ?? existingEvent.salesCutoffHours,
        refundPolicyText: FIXED_REFUND_POLICY,
        canvasImageUrl: body.canvasImageUrl ?? existingEvent.canvasImageUrl ?? "",
        canvasName: body.canvasName ?? existingEvent.canvasName ?? "",
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    for (const key of Object.keys(body)) {
      if (allowed.includes(key)) {
        updateData[key] = ["address", "city", "state", "zip", "canvasImageUrl", "canvasName"].includes(key)
          ? body[key] || null
          : body[key];
      }
    }

    updateData.ticketPriceCents = FIXED_TICKET_PRICE_CENTS;
    updateData.refundPolicyText = FIXED_REFUND_POLICY;

    if (
      allowed.includes("visibility") &&
      (
        body.visibility !== existingEvent.visibility ||
        ((body.visibility ?? existingEvent.visibility) === "PRIVATE" && !existingEvent.eventCode)
      )
    ) {
      const nextVisibility = (body.visibility ?? existingEvent.visibility) as "PUBLIC" | "PRIVATE";
      updateData.eventCode = await resolveEventCodeForVisibility(nextVisibility, existingEvent.eventCode);
    }

    let event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    if (!event.qrCodeImageUrl || event.qrCodeImageUrl.endsWith(".png")) {
      const qrCodeImageUrl = await generateEventQrCode(event.id, event.slug);
      event = await prisma.event.update({
        where: { id: event.id },
        data: { qrCodeImageUrl },
      });
    }

    const changes = buildEventUpdateChanges(existingEvent, event);

    if (changes.length > 0) {
      const eventUrl =
        event.visibility === "PRIVATE" && event.eventCode
          ? getAbsoluteUrl(`/e/${event.slug}?code=${encodeURIComponent(event.eventCode)}`)
          : getAbsoluteUrl(`/e/${event.slug}`);
      const previewUrl = getAbsoluteUrl(`/dashboard/events/${event.id}/preview`);
      const guestRecipients = Array.from(
        new Map(
          existingEvent.bookings
            .filter((booking) => booking.purchaserEmail)
            .map((booking) => [
              booking.purchaserEmail.trim().toLowerCase(),
              booking,
            ])
        ).values()
      );
      const notificationBase = {
        eventTitle: event.title,
        eventUrl,
        previewUrl,
        startDateTime: event.startDateTime,
        locationName: event.locationName,
        address: event.address,
        city: event.city,
        state: event.state,
        zip: event.zip,
        changes,
      };
      const notifications = [
        sendAdminEventUpdatedEmail(notificationBase),
        existingEvent.host.email
          ? sendEventUpdatedEmail({
              ...notificationBase,
              to: existingEvent.host.email,
              recipientName: existingEvent.host.name,
              audience: "host",
            })
          : Promise.resolve(),
        ...guestRecipients.map((booking) =>
          sendEventUpdatedEmail({
            ...notificationBase,
            to: booking.purchaserEmail,
            recipientName: booking.purchaserName,
            audience: "guest",
          })
        ),
      ];

      void Promise.allSettled(notifications).then((results) => {
        const rejected = results.filter((result) => result.status === "rejected");
        if (rejected.length > 0) {
          console.error("Event update notification email failed:", rejected);
        }
      });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId, hostId: session.user.id },
      include: { _count: { select: { bookings: { where: { status: "PAID" } } } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete event with paid bookings" },
        { status: 400 }
      );
    }

    await prisma.event.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event deletion error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
