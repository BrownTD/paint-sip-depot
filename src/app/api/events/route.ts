import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";

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

    let slug = generateSlug(parsed.data.title);
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await prisma.event.create({
      data: {
        hostId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        slug,
        startDateTime: parsed.data.startDateTime,
        endDateTime: parsed.data.endDateTime || null,
        locationName: parsed.data.locationName,
        address: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        zip: parsed.data.zip,
        ticketPriceCents: parsed.data.ticketPriceCents,
        capacity: parsed.data.capacity,
        salesCutoffHours: parsed.data.salesCutoffHours,
        refundPolicyText: parsed.data.refundPolicyText || null,
        canvasImageUrl: parsed.data.canvasImageUrl || null,
        canvasId: body.canvasId || null,
        status: body.status || "DRAFT",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}