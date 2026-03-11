import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaidTicketQuantitiesForEvents } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CalendarEventRecord = {
  id: string;
  title: string;
  startDateTime: Date;
  status: string;
  city: string | null;
  capacity: number;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events: CalendarEventRecord[] = await prisma.event.findMany({
      where: { hostId: session.user.id },
      select: {
        id: true,
        title: true,
        startDateTime: true,
        status: true,
        city: true,
        capacity: true,
      },
      orderBy: { startDateTime: "asc" },
    });

    const paidByEventId = await getPaidTicketQuantitiesForEvents(
      prisma,
      events.map((event) => event.id)
    );

    const formattedEvents = events.map((event: (typeof events)[number]) => ({
      id: event.id,
      title: event.title,
      startDateTime: event.startDateTime.toISOString(),
      status: event.status,
      city: event.city,
      ticketsSold: paidByEventId.get(event.id) ?? 0,
      capacity: event.capacity,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("Calendar events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
