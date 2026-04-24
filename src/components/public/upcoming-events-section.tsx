import Link from "next/link";
import { CalendarSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicEventCard } from "@/components/public/event-card";

type UpcomingEventsSectionProps = {
  events: Array<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    canvasImageUrl: string | null;
    locationName: string;
    city: string | null;
    state: string | null;
    eventFormat: "IN_PERSON" | "VIRTUAL";
    visibility: "PUBLIC" | "PRIVATE";
    ticketPriceCents: number;
    startDateTime: Date;
    host: { name: string | null };
    canvasName: string | null;
  }>;
};

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  return (
    <section className="px-2 pb-24 pt-0 sm:px-4 md:pb-32 md:pt-0">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="rounded-[36px] border border-border/70 bg-gradient-to-br from-background via-muted/25 to-accent/10 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] sm:p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">
              Discovery
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Upcoming Events
            </h2>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Discover public paint &amp; sip experiences happening soon
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "All", href: "/events" },
              { label: "This Week", href: "/events?when=THIS_WEEK" },
              { label: "Virtual", href: "/events?format=VIRTUAL" },
              { label: "In Person", href: "/events?format=IN_PERSON" },
            ].map((chip, index) => (
              <Link key={chip.label} href={chip.href}>
                <Button
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-4"
                >
                  {chip.label}
                </Button>
              </Link>
            ))}
          </div>

          {events.length === 0 ? (
            <div className="mx-auto mt-16 max-w-2xl rounded-[32px] border border-dashed border-border bg-card/70 px-8 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CalendarSearch className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold">No public events live right now</h3>
              <p className="mt-3 text-muted-foreground">
                Check back soon or enter an event code from your host
              </p>
              <Link href="/events" className="mt-8 inline-block">
                <Button size="lg" className="rounded-full px-6">Find an Event</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
