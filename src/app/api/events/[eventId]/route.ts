import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { resolveEventCodeForVisibility } from "@/lib/event-discovery";

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
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const parsed = eventSchema.safeParse({
      ...body,
      startDateTime: new Date(body.startDateTime),
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const allowedUpdates: Record<string, string[]> = {
      DRAFT: ["status", "title", "description", "startDateTime", "endDateTime", "locationName", "address", "city", "state", "zip", "ticketPriceCents", "capacity", "salesCutoffHours", "refundPolicyText", "canvasImageUrl", "canvasId", "visibility", "eventFormat"],
      PUBLISHED: ["status", "title", "description", "startDateTime", "endDateTime", "locationName", "address", "city", "state", "zip", "ticketPriceCents", "capacity", "salesCutoffHours", "refundPolicyText", "canvasImageUrl", "canvasId", "visibility", "eventFormat"],
      ENDED: [],
      CANCELED: [],
    };

    const allowed = allowedUpdates[existingEvent.status] || [];
    const updateData: Record<string, unknown> = {};

    for (const key of Object.keys(body)) {
      if (allowed.includes(key)) {
        updateData[key] = ["address", "city", "state", "zip", "canvasId", "canvasImageUrl"].includes(key)
          ? body[key] || null
          : body[key];
      }
    }

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

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

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
