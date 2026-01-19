import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime, getCutoffDate, isSalesCutoffPassed } from "@/lib/utils";
import {
  Palette,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingForm } from "@/components/booking-form";

async function getEvent(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!event) return null;

  // Count only PAID bookings for "tickets sold" and remaining spots.
  const paidBookingsCount = await prisma.booking.count({
    where: { eventId: event.id, status: "PAID" },
  });

  return { ...event, paidBookingsCount } as typeof event & {
    paidBookingsCount: number;
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: event.title,
    description:
      event.description ||
      `Join us for ${event.title} at ${event.locationName} on ${formatDate(event.startDateTime)}`,
    openGraph: {
      title: event.title,
      description: event.description || undefined,
      images: event.canvasImageUrl ? [event.canvasImageUrl] : undefined,
    },
  };
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ canceled?: string }> | { canceled?: string };
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};

  const event = await getEvent(slug);

  if (!event || event.status === "DRAFT") {
    notFound();
  }

  const totalSold = event.paidBookingsCount;
  const spotsRemaining = event.capacity - totalSold;
  const isCutoff = isSalesCutoffPassed(event.startDateTime, event.salesCutoffHours);
  const cutoffDate = getCutoffDate(event.startDateTime, event.salesCutoffHours);
  const isPastEvent = new Date(event.startDateTime) < new Date();
  const isCanceled = event.status === "CANCELED";
  const isSoldOut = spotsRemaining <= 0;

  const canBook = !isCutoff && !isPastEvent && !isCanceled && !isSoldOut;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold">Paint & Sip Depot</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to all events
        </Link>

        {/* Canceled notice */}
        {sp.canceled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Checkout was canceled. Feel free to try again when you&apos;re ready.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Canvas Image */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
              {event.canvasImageUrl ? (
                <Image
                  src={event.canvasImageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Palette className="w-20 h-20 text-muted-foreground/20" />
                </div>
              )}

              {/* Status badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isCanceled && (
                  <Badge variant="destructive" className="text-sm">
                    Canceled
                  </Badge>
                )}
                {isSoldOut && !isCanceled && (
                  <Badge variant="secondary" className="text-sm">
                    Sold Out
                  </Badge>
                )}
                {isCutoff && !isCanceled && !isSoldOut && (
                  <Badge variant="warning" className="text-sm">
                    Sales Ended
                  </Badge>
                )}
              </div>
            </div>

            {/* Title & Meta */}
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(event.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>
                    {formatTime(event.startDateTime)}
                    {event.endDateTime && ` - ${formatTime(event.endDateTime)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{spotsRemaining} spots remaining</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="prose prose-gray max-w-none">
                <h2 className="text-xl font-semibold mb-3">About This Event</h2>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {event.description}
                </p>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h2>
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">{event.locationName}</p>
                  <p className="text-muted-foreground">
                    {event.address}
                    <br />
                    {event.city}, {event.state} {event.zip}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Policies */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Important Information</h2>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="font-medium text-sm">Sales Cutoff</p>
                    <p className="text-sm text-muted-foreground">
                      Ticket sales end{" "}
                      <span className="font-medium">{event.salesCutoffHours} hours</span>{" "}
                      before the event ({formatDate(cutoffDate)} at{" "}
                      {formatTime(cutoffDate)})
                    </p>
                  </div>

                  {event.refundPolicyText && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium text-sm">Refund Policy</p>
                        <p className="text-sm text-muted-foreground">
                          {event.refundPolicyText}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Host */}
            <div className="text-sm text-muted-foreground">
              Hosted by <span className="font-medium">{event.host.name}</span>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold">
                      {formatAmountForDisplay(event.ticketPriceCents)}
                    </p>
                    <p className="text-muted-foreground text-sm">per person</p>
                  </div>

                  {canBook ? (
                    <BookingForm
                      eventId={event.id}
                      maxQuantity={Math.min(spotsRemaining, 10)}
                      ticketPrice={event.ticketPriceCents}
                    />
                  ) : (
                    <div className="text-center py-4">
                      {isCanceled && (
                        <p className="text-destructive font-medium">
                          This event has been canceled
                        </p>
                      )}
                      {isSoldOut && !isCanceled && (
                        <p className="text-muted-foreground font-medium">
                          This event is sold out
                        </p>
                      )}
                      {isCutoff && !isCanceled && !isSoldOut && (
                        <p className="text-muted-foreground font-medium">
                          Ticket sales have ended
                        </p>
                      )}
                      {isPastEvent && !isCanceled && (
                        <p className="text-muted-foreground font-medium">
                          This event has already taken place
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Paint & Sip Depot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}