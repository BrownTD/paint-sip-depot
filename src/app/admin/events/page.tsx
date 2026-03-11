import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { getPaidTicketQuantitiesForEvents } from "@/lib/booking";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function getAdminEvents() {
  const events = await prisma.event.findMany({
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

    return {
      ...event,
      ticketsSold,
      remaining: Math.max(event.capacity - ticketsSold, 0),
    };
  });
}

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
              <table className="w-full min-w-[1080px]">
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
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 align-top">
                        <div>
                          <Link href={`/e/${event.slug}`} className="font-medium text-primary hover:underline">
                            {event.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {event.locationName}
                            {event.city ? `, ${event.city}` : ""}
                          </p>
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
                        <Badge variant={statusColors[event.status]}>{event.status.toLowerCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-sm font-medium">
                        {event.ticketsSold} / {event.capacity}
                      </td>
                      <td className="px-4 py-3 align-top text-sm font-medium">
                        {event.remaining}
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
