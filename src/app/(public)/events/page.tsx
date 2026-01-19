import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";
import { Palette, Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Browse Events",
  description: "Find and book paint and sip events near you",
};

async function getPublishedEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startDateTime: { gt: new Date() },
    },
    include: {
      host: { select: { name: true } },
      _count: { select: { bookings: { where: { status: "PAID" } } } },
    },
    orderBy: { startDateTime: "asc" },
  });
  return events;
}

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold">Paint & Sip Depot</span>
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary">
            Host Login
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Upcoming Events
          </h1>
          <p className="text-muted-foreground">
            Find a paint and sip event near you and unleash your creativity
          </p>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No upcoming events</h2>
              <p className="text-muted-foreground mb-6">
                Check back soon for new events, or{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  become a host
                </Link>{" "}
                and create your own!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const spotsRemaining = event.capacity - event._count.bookings;

              return (
                <Link key={event.id} href={`/e/${event.slug}`}>
                  <article className="group bg-card rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {event.canvasImageUrl ? (
                        <Image
                          src={event.canvasImageUrl}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Palette className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        {formatAmountForDisplay(event.ticketPriceCents)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>
                            {formatDate(event.startDateTime)} at{" "}
                            {formatTime(event.startDateTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="line-clamp-1">
                            {event.locationName}, {event.city}, {event.state}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Hosted by {event.host.name}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            spotsRemaining <= 5
                              ? "text-destructive"
                              : "text-primary"
                          }`}
                        >
                          {spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""} left
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
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