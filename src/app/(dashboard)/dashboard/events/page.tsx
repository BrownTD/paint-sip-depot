import { auth } from "@/lib/auth";
import { getPaidTicketQuantitiesForEvents } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { Plus, Calendar, MapPin, Users, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventCodeCopyButton } from "@/components/dashboard/event-code-copy-button";

type HostEventRecord = {
  id: string;
  title: string;
  slug: string;
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
  eventCode: string | null;
};

async function getHostEvents(hostId: string) {
  const events: HostEventRecord[] = await prisma.event.findMany({
    where: { hostId },
    orderBy: { startDateTime: "desc" },
  });

  const paidByEventId = await getPaidTicketQuantitiesForEvents(
    prisma,
    events.map((event) => event.id)
  );

  return events.map((event) => ({
    ...event,
    ticketsSold: paidByEventId.get(event.id) ?? 0,
  }));
}

type HostEvent = Awaited<ReturnType<typeof getHostEvents>>[number];

const statusColors = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ENDED: "outline",
  CANCELED: "destructive",
} as const;

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
        <div className="grid gap-4">
          {events.map((event: HostEvent) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-32 md:h-auto bg-muted shrink-0">
                  {event.canvasImageUrl ? (
                    <img
                      src={event.canvasImageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusColors[event.status as keyof typeof statusColors]}>
                            {event.status.toLowerCase()}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              event.visibility === "PUBLIC"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-[#6741ff]/20 bg-[#6741ff]/10 text-[#6741ff]"
                            }
                          >
                            {event.visibility === "PUBLIC" ? "public" : "private"}
                          </Badge>
                          <Badge variant="secondary">
                            {event.eventFormat === "VIRTUAL" ? "virtual" : "in person"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.eventFormat === "VIRTUAL"
                            ? "Virtual"
                            : `${event.city}, ${event.state}`}
                        </span>
                      </div>
                      {event.canvasName ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          <span>Canvas: {event.canvasName}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatAmountForDisplay(event.ticketPriceCents)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-3 h-3 inline mr-1" />
                        {Number(event.ticketsSold)} / {Number(event.capacity)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {event.status === "CANCELED" ? (
                      <Button variant="outline" size="sm" disabled className="opacity-60">
                        Manage
                      </Button>
                    ) : (
                      <Link href={`/dashboard/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    )}

                    {event.eventCode ? (
                      <EventCodeCopyButton eventCode={event.eventCode} />
                    ) : null}

                    {event.status === "PUBLISHED" && (
                      <Link href={`/e/${event.slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Event Page
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
