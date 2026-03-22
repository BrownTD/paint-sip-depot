import { auth } from "@/lib/auth";
import { getPaidTicketQuantitiesForEvents } from "@/lib/booking";
import { generateEventQrCode } from "@/lib/event-qr";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HostEventsList } from "@/components/dashboard/host-events-list";

type HostEventRecord = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  startDateTime: Date;
  city: string | null;
  state: string | null;
  status: "DRAFT" | "PUBLISHED" | "ENDED" | "CANCELED";
  visibility: "PUBLIC" | "PRIVATE";
  eventFormat: "IN_PERSON" | "VIRTUAL";
  capacity: number;
  ticketPriceCents: number;
  canvasImageUrl: string | null;
  canvasName: string | null;
  qrCodeImageUrl: string | null;
  eventCode: string | null;
};

async function getHostEvents(hostId: string) {
  const events: HostEventRecord[] = await prisma.event.findMany({
    where: { hostId },
    orderBy: { createdAt: "desc" },
  });

  const eventsMissingQr = events.filter(
    (event) => !event.qrCodeImageUrl || event.qrCodeImageUrl.endsWith(".png")
  );

  if (eventsMissingQr.length > 0) {
    await Promise.all(
      eventsMissingQr.map(async (event) => {
        const qrCodeImageUrl = await generateEventQrCode(event.id, event.slug);

        await prisma.event.update({
          where: { id: event.id },
          data: { qrCodeImageUrl },
        });

        event.qrCodeImageUrl = qrCodeImageUrl;
      })
    );
  }

  const paidByEventId = await getPaidTicketQuantitiesForEvents(
    prisma,
    events.map((event) => event.id)
  );

  const statusPriority = {
    PUBLISHED: 0,
    DRAFT: 1,
    CANCELED: 2,
    ENDED: 3,
  } as const;

  return events
    .map((event) => ({
      ...event,
      ticketsSold: paidByEventId.get(event.id) ?? 0,
    }))
    .sort((a, b) => {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

type HostEvent = Awaited<ReturnType<typeof getHostEvents>>[number];

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const events = await getHostEvents(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">Manage your paint and sip events</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No events yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first event and start selling tickets
            </p>
            <Link href="/dashboard/events/new">
              <Button>Create Your First Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <HostEventsList events={events as HostEvent[]} />
      )}
    </div>
  );
}
