import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime, getAbsoluteUrl } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventActions } from "@/components/event-actions";

async function getEvent(eventId: string, hostId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, hostId },
    include: {
      bookings: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { bookings: { where: { status: "PAID" } } },
      },
    },
  });
  return event;
}

const statusColors = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ENDED: "outline",
  CANCELED: "destructive",
} as const;

export default async function EventDetailPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const event = await getEvent(params.eventId, session.user.id);
  if (!event) notFound();

  const totalRevenue = event.bookings.reduce((sum, b) => sum + b.amountPaidCents, 0);
  const ticketsSold = event._count.bookings;
  const spotsRemaining = event.capacity - ticketsSold;
  const publicUrl = getAbsoluteUrl(`/e/${event.slug}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>
        <EventActions event={event} />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-64 aspect-square rounded-xl overflow-hidden bg-muted shrink-0">
          {event.canvasImageUrl ? (
            <Image
              src={event.canvasImageUrl}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold">{event.title}</h1>
            <Badge variant={statusColors[event.status]}>{event.status.toLowerCase()}</Badge>
          </div>

          <div className="space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.startDateTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {formatTime(event.startDateTime)}
                {event.endDateTime && ` - ${formatTime(event.endDateTime)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {event.locationName}, {event.city}, {event.state}
              </span>
            </div>
          </div>

          {event.status === "PUBLISHED" && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Public URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-background px-3 py-2 rounded border truncate">
                  {publicUrl}
                </code>
                <Button variant="outline" size="icon" asChild>
                  <Link href={publicUrl} target="_blank">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmountForDisplay(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsSold}</div>
            <p className="text-xs text-muted-foreground">of {event.capacity} capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spots Remaining</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spotsRemaining}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Price</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmountForDisplay(event.ticketPriceCents)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-1">Location</p>
              <p className="text-sm text-muted-foreground">
                {event.locationName}
                <br />
                {event.address}
                <br />
                {event.city}, {event.state} {event.zip}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-1">Sales Cutoff</p>
              <p className="text-sm text-muted-foreground">
                {event.salesCutoffHours} hours before event
              </p>
            </div>

            {event.refundPolicyText && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Refund Policy</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.refundPolicyText}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}