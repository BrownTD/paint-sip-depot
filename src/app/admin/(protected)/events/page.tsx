import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { getBookingCutoffDate, getPaidTicketQuantitiesForEvents } from "@/lib/booking";
import { formatDate, formatDateInputValue, formatTime, formatTimeInputValue } from "@/lib/utils";
import { EventCutoffOverrideControl } from "@/components/admin/event-cutoff-override-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AdminEventRecord = {
  id: string;
  title: string;
  slug: string;
  canvasImageUrl: string | null;
  canvasName: string | null;
  locationName: string;
  city: string | null;
  startDateTime: Date;
  eventFormat: "IN_PERSON" | "VIRTUAL";
  visibility: "PUBLIC" | "PRIVATE";
  status: "DRAFT" | "PUBLISHED" | "ENDED" | "CANCELED";
  capacity: number;
  bookingCutoffOverrideAt: Date | null;
  host: {
    name: string | null;
    email: string;
  };
};

async function getAdminEvents() {
  const events: AdminEventRecord[] = await prisma.event.findMany({
    include: {
      host: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { startDateTime: "desc" },
  });

  const paidByEventId = await getPaidTicketQuantitiesForEvents(
    prisma,
    events.map((event) => event.id)
  );

  return events.map((event) => {
    const ticketsSold = paidByEventId.get(event.id) ?? 0;
    const effectiveCutoff = getBookingCutoffDate(
      event.startDateTime,
      event.bookingCutoffOverrideAt
    );

    return {
      ...event,
      ticketsSold,
      remaining: Math.max(Number(event.capacity) - Number(ticketsSold), 0),
      effectiveCutoff,
    };
  });
}

type AdminEvent = Awaited<ReturnType<typeof getAdminEvents>>[number];

const statusColors = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ENDED: "outline",
  CANCELED: "destructive",
} as const;

export default async function AdminEventsPage() {
  await requireAdminSession();
  const events = await getAdminEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor current events, hosts, sold tickets, and remaining capacity.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">View Orders</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Host</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Format</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Visibility</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sold</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Remaining</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Booking Cutoff</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event: AdminEvent) => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {event.canvasImageUrl ? (
                              <img
                                src={event.canvasImageUrl}
                                alt={event.canvasName || event.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <Link href={`/e/${event.slug}`} className="font-medium text-primary hover:underline">
                              {event.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {event.locationName}
                              {event.city ? `, ${event.city}` : ""}
                            </p>
                            {event.canvasName ? (
                              <p className="text-sm text-muted-foreground">Canvas: {event.canvasName}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <p className="font-medium">{event.host.name || "Unknown host"}</p>
                          <p className="text-sm text-muted-foreground">{event.host.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        <div>{formatDate(event.startDateTime)}</div>
                        <div className="text-muted-foreground">{formatTime(event.startDateTime)}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {event.eventFormat === "VIRTUAL" ? "Virtual" : "In person"}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        {event.visibility === "PUBLIC" ? "Public" : "Private"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={statusColors[event.status as keyof typeof statusColors]}>{event.status.toLowerCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-sm font-medium">
                        {Number(event.ticketsSold)} / {Number(event.capacity)}
                      </td>
                      <td className="px-4 py-3 align-top text-sm font-medium">
                        {Number(event.remaining)}
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium">
                              {formatDate(event.effectiveCutoff)} at {formatTime(event.effectiveCutoff)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.bookingCutoffOverrideAt ? "Admin override active" : "Default cutoff"}
                            </p>
                          </div>
                          <EventCutoffOverrideControl
                            eventId={event.id}
                            initialDate={formatDateInputValue(
                              event.bookingCutoffOverrideAt ?? event.effectiveCutoff
                            )}
                            initialTime={formatTimeInputValue(
                              event.bookingCutoffOverrideAt ?? event.effectiveCutoff
                            )}
                            hasOverride={Boolean(event.bookingCutoffOverrideAt)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
