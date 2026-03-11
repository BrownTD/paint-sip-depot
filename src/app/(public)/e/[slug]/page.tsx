import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { areBookingsClosed, getBookingCutoffDate, getRemainingTickets } from "@/lib/booking";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingForm } from "@/components/booking-form";
import { PublicHeader } from "@/components/public/public-header";

async function getEvent(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true } },
    },
  });

  if (!event) return null;

  const availability = await getRemainingTickets(prisma, event.id, event.capacity);

  return { ...event, availability } as typeof event & {
    availability: {
      paid: number;
      reserved: number;
      remaining: number;
    };
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
  searchParams?: Promise<{ canceled?: string; code?: string }> | { canceled?: string; code?: string };
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};

  const event = await getEvent(slug);

  const code = typeof sp?.code === "string" ? sp.code.toUpperCase() : null;

  if (!event || event.status === "DRAFT") {
    notFound();
  }

  const isPrivateLocked = event.visibility === "PRIVATE" && code !== event.eventCode;

  const totalSold = event.availability.paid;
  const spotsRemaining = event.availability.remaining;
  const isCutoff = areBookingsClosed(event.startDateTime);
  const cutoffDate = getBookingCutoffDate(event.startDateTime);
  const isPastEvent = new Date(event.startDateTime) < new Date();
  const isCanceled = event.status === "CANCELED";
  const isSoldOut = spotsRemaining <= 0;

  const canBook = !isCutoff && !isPastEvent && !isCanceled && !isSoldOut;

  return (
    <div className="min-h-screen bg-muted/30">
      <PublicHeader
        links={[
          { href: "/", label: "Home" },
          { href: "/events", label: "Find an Event" },
        ]}
      />

      <main className="container mx-auto max-w-5xl px-4 py-8 pt-28">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to all events
        </Link>

        {isPrivateLocked ? (
          <div className="mx-auto max-w-2xl">
            <Card className="overflow-hidden border-border/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[16/7] bg-muted">
                {event.canvasImageUrl ? (
                  <img
                    src={event.canvasImageUrl}
                    alt={event.title}
                    className="h-full w-full object-cover opacity-35 blur-[1px]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Palette className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background" />
              </div>
              <CardContent className="space-y-6 p-8 pt-8 text-center">
                <Badge variant="outline" className="border-[#6741ff]/20 bg-[#6741ff]/10 text-[#6741ff]">
                  Private Event
                </Badge>
                <div>
                  <h1 className="font-display text-3xl font-bold">{event.title}</h1>
                  <p className="mt-3 text-muted-foreground">
                    This event is private. Enter the event code from your host to unlock the event page.
                  </p>
                </div>

                <form method="GET" className="mx-auto max-w-md space-y-3">
                  <label htmlFor="code" className="block text-left text-sm font-medium">
                    Event Code
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="code"
                      name="code"
                      defaultValue={typeof sp?.code === "string" ? sp.code : ""}
                      placeholder="Example: PSD-84K2M"
                      className="h-12 flex-1 rounded-full border border-input bg-background px-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button type="submit" className="h-12 rounded-full px-6">
                      Unlock Event
                    </Button>
                  </div>
                </form>

                {typeof sp?.code === "string" ? (
                  <p className="text-sm text-destructive">
                    We couldn&apos;t unlock this event with that code.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {sp.canceled && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Checkout was canceled. Feel free to try again when you&apos;re ready.
                </p>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
                  {event.canvasImageUrl ? (
                    <img
                      src={event.canvasImageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Palette className="w-20 h-20 text-muted-foreground/20" />
                    </div>
                  )}

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

                <div>
                  <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">
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
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {event.eventFormat === "VIRTUAL" ? "Virtual" : "In Person"}
                      </Badge>
                      {event.visibility === "PRIVATE" ? (
                        <Badge variant="outline">Code Access</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="prose prose-gray max-w-none">
                    <h2 className="mb-3 text-xl font-semibold">About This Event</h2>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                )}

                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                    <MapPin className="w-5 h-5" />
                    Location
                  </h2>
                  <Card>
                    <CardContent className="p-4">
                      {event.eventFormat === "VIRTUAL" ? (
                        <>
                          <p className="font-medium">Virtual event</p>
                          <p className="text-muted-foreground">
                            Join online from anywhere. Your host will provide access details after booking.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{event.locationName}</p>
                          <p className="text-muted-foreground">
                            {event.address}
                            <br />
                            {event.city}, {event.state} {event.zip}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h2 className="mb-3 text-xl font-semibold">Important Information</h2>
                  <Card>
                    <CardContent className="space-y-4 p-4">
                      <div>
                        <p className="font-medium text-sm">Sales Cutoff</p>
                        <p className="text-sm text-muted-foreground">
                          Bookings close 7 days before the event ({formatDate(cutoffDate)} at{" "}
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

                <div className="text-sm text-muted-foreground">
                  Hosted by <span className="font-medium">{event.host.name}</span>
                </div>
              </div>

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
                        <div className="py-4 text-center">
                          {isCanceled && (
                            <p className="font-medium text-destructive">
                              This event has been canceled
                            </p>
                          )}
                          {isSoldOut && !isCanceled && (
                            <p className="font-medium text-muted-foreground">
                              This event is sold out
                            </p>
                          )}
                          {isCutoff && !isCanceled && !isSoldOut && (
                            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                              <p className="font-medium text-foreground">Bookings have closed</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                This event is within 7 days of starting.
                              </p>
                            </div>
                          )}
                          {isPastEvent && !isCanceled && (
                            <p className="font-medium text-muted-foreground">
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <p>© {new Date().getFullYear()} Paint & Sip Depot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
