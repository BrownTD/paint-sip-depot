import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  sendAdminEventCreatedEmail,
  sendHostEventCreatedEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { generateRandomSlug, getAbsoluteUrl } from "@/lib/utils";
import { resolveEventCodeForVisibility } from "@/lib/event-discovery";

const FIXED_TICKET_PRICE_CENTS = 3500;
const FIXED_REFUND_POLICY =
  "Full refunds available up to 72 hours before the event. 50% refund between 72-48 hours. No refunds within 48 hours of the event.";

async function generateUniqueEventSlug() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = generateRandomSlug();
    const existingSlug = await prisma.event.findUnique({ where: { slug } });

    if (!existingSlug) {
      return slug;
    }
  }

  throw new Error("Failed to generate a unique event slug");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { hostId: session.user.id },
      include: {
        _count: { select: { bookings: { where: { status: "PAID" } } } },
      },
      orderBy: { startDateTime: "desc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const dataToValidate = {
      ...body,
      startDateTime: new Date(body.startDateTime),
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : undefined,
    };

    const parsed = eventSchema.safeParse(dataToValidate);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const slug = await generateUniqueEventSlug();

    const eventCode = await resolveEventCodeForVisibility(parsed.data.visibility);

    const event = await prisma.event.create({
      data: {
        hostId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        slug,
        ...(eventCode ? { eventCode } : {}),
        startDateTime: parsed.data.startDateTime,
        endDateTime: parsed.data.endDateTime || null,
        locationName: parsed.data.locationName,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        zip: parsed.data.zip || null,
        visibility: parsed.data.visibility,
        eventFormat: parsed.data.eventFormat,
        ticketPriceCents: FIXED_TICKET_PRICE_CENTS,
        capacity: parsed.data.capacity,
        salesCutoffHours: parsed.data.salesCutoffHours,
        refundPolicyText: FIXED_REFUND_POLICY,
        canvasImageUrl: parsed.data.canvasImageUrl || null,
        canvasName: parsed.data.canvasName || null,
        status: body.status || "DRAFT",
      },
    });

    const eventUrl = getAbsoluteUrl(`/e/${event.slug}`);

    void Promise.allSettled([
      session.user.email
        ? sendHostEventCreatedEmail({
            to: session.user.email,
            recipientName: session.user.name,
            eventTitle: event.title,
            eventUrl,
            startDateTime: event.startDateTime,
            locationName: event.locationName,
            visibility: event.visibility,
          })
        : Promise.resolve(),
      sendAdminEventCreatedEmail({
        recipientName: "Admin",
        eventTitle: event.title,
        eventUrl,
        startDateTime: event.startDateTime,
        locationName: event.locationName,
        visibility: event.visibility,
      }),
    ]).then((results) => {
      const rejected = results.filter((result) => result.status === "rejected");
      if (rejected.length > 0) {
        console.error("Event notification email failed:", rejected);
      }
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
