import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: { hostId: session.user.id },
      select: {
        id: true,
        title: true,
        startDateTime: true,
        status: true,
        city: true,
        capacity: true,
        _count: { select: { bookings: { where: { status: "PAID" } } } },
      },
      orderBy: { startDateTime: "asc" },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      startDateTime: event.startDateTime.toISOString(),
      status: event.status,
      city: event.city,
      ticketsSold: event._count.bookings,
      capacity: event.capacity,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("Calendar events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}