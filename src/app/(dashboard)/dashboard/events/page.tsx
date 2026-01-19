import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Plus, Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

async function getHostEvents(hostId: string) {
  return prisma.event.findMany({
    where: { hostId },
    include: { _count: { select: { bookings: { where: { status: "PAID" } } } } },
    orderBy: { startDateTime: "desc" },
  });
}

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
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-32 md:h-auto bg-muted shrink-0">
                  {event.canvasImageUrl ? (
                    <Image
                      src={event.canvasImageUrl}
                      alt={event.title}
                      fill
                      className="object-cover"
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={statusColors[event.status]}>
                          {event.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.city}, {event.state}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatAmountForDisplay(event.ticketPriceCents)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-3 h-3 inline mr-1" />
                        {event._count.bookings} / {event.capacity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                    {event.status === "PUBLISHED" && (
                      <Link href={`/e/${event.slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Public Page
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