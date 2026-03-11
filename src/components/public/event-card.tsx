import Link from "next/link";
import { CalendarDays, MapPin, Paintbrush2, Sparkles, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";

type PublicEventCardProps = {
  event: {
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
  };
};

export function PublicEventCard({ event }: PublicEventCardProps) {
  const cover = event.canvasImageUrl;
  const locationLabel =
    event.eventFormat === "VIRTUAL"
      ? "Virtual"
      : [event.locationName, event.city, event.state].filter(Boolean).join(", ");

  return (
    <article className="group overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/15 via-background to-accent/20">
        {cover ? (
          <img
            src={cover}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="rounded-3xl bg-background/85 p-5 shadow-sm">
              <Paintbrush2 className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Scaffold placeholder
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Event cover image</p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 hidden items-start justify-between p-4 sm:flex">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-background/90 text-foreground backdrop-blur-sm">Public</Badge>
            <Badge variant="success" className="bg-emerald-500/90">Live</Badge>
          </div>
          <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-sm">
            {event.eventFormat === "VIRTUAL" ? "Virtual" : "In Person"}
          </Badge>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {event.host.name || "Paint & Sip Host"}
            </p>
            <div className="rounded-full bg-primary/8 px-3 py-1 text-sm font-semibold text-primary">
              {formatAmountForDisplay(event.ticketPriceCents)}
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {event.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
              <Badge className="bg-background text-foreground">Public</Badge>
              <Badge variant="success" className="bg-emerald-500/90">Live</Badge>
              <Badge variant="secondary" className="bg-secondary text-foreground">
                {event.eventFormat === "VIRTUAL" ? "Virtual" : "In Person"}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {event.description?.slice(0, 125) || "Discover a guided paint and sip experience crafted for guests looking for a memorable night out."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>
              {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{locationLabel}</span>
          </div>
          {event.canvasName ? (
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Canvas preview: {event.canvasName}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-border/70 pt-4">
          <Link href={`/e/${event.slug}`}>
            <Button className="rounded-full px-5">
              <Ticket className="mr-2 h-4 w-4" />
              View Event
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
