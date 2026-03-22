"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, Image as ImageIcon, MapPin, Users } from "lucide-react";
import { EventQrDownloadButton } from "@/components/dashboard/event-qr-download-button";
import { EventCodeCopyButton } from "@/components/dashboard/event-code-copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";

export type HostEventsListItem = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
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
  qrCodeImageUrl: string | null;
  eventCode: string | null;
  ticketsSold: number;
};

type DisplayStatus = HostEventsListItem["status"] | "COMPLETED";

const statusColors = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ENDED: "outline",
  CANCELED: "destructive",
  COMPLETED: "outline",
} as const;

function EventCard({ event }: { event: HostEventsListItem }) {
  const isPastEvent = new Date(event.startDateTime) < new Date();
  const isRelaunchable = event.status === "CANCELED" || isPastEvent;
  const displayStatus: DisplayStatus =
    event.status === "CANCELED" ? "CANCELED" : isPastEvent ? "COMPLETED" : event.status;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-32 w-full shrink-0 bg-muted md:h-auto md:w-48">
          {event.canvasImageUrl ? (
            <img
              src={event.canvasImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusColors[displayStatus as keyof typeof statusColors]}>
                    {displayStatus.toLowerCase()}
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
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.eventFormat === "VIRTUAL" ? "Virtual" : `${event.city}, ${event.state}`}
                </span>
              </div>
              {event.canvasName ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span>Canvas: {event.canvasName}</span>
                </div>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold">{formatAmountForDisplay(event.ticketPriceCents)}</p>
              <p className="text-sm text-muted-foreground">
                <Users className="mr-1 inline h-3 w-3" />
                {Number(event.ticketsSold)} / {Number(event.capacity)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {isRelaunchable ? (
              <Link href={`/dashboard/events/${event.id}?relaunch=1`}>
                <Button variant="outline" size="sm">
                  Relaunch
                </Button>
              </Link>
            ) : (
              <Link href={`/dashboard/events/${event.id}`}>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            )}

            {event.eventCode ? <EventCodeCopyButton eventCode={event.eventCode} /> : null}

            {event.status === "PUBLISHED" ? (
              <Link href={`/e/${event.slug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  View Event Page
                </Button>
              </Link>
            ) : null}

            {event.qrCodeImageUrl ? (
              <EventQrDownloadButton
                fileName={`${event.slug}-qr.png`}
                qrCodeImageUrl={event.qrCodeImageUrl}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HostEventsList({ events }: { events: HostEventsListItem[] }) {
  const [showPastEvents, setShowPastEvents] = useState(false);

  const { currentEvents, pastEvents } = useMemo(() => {
    const now = new Date();

    return events.reduce(
      (acc, event) => {
        const isPastEvent = new Date(event.startDateTime) < now;
        const isOlderEvent = event.status === "CANCELED" || isPastEvent;

        if (isOlderEvent) {
          acc.pastEvents.push(event);
        } else {
          acc.currentEvents.push(event);
        }

        return acc;
      },
      {
        currentEvents: [] as HostEventsListItem[],
        pastEvents: [] as HostEventsListItem[],
      }
    );
  }, [events]);

  const visibleEvents = showPastEvents ? [...currentEvents, ...pastEvents] : currentEvents;

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className={
              pastEvents.some((pastEvent) => pastEvent.id === event.id)
                ? "transition-all duration-300 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:max-h-0 data-[state=closed]:translate-y-4 data-[state=closed]:overflow-hidden data-[state=closed]:opacity-0 data-[state=open]:max-h-[420px] data-[state=open]:translate-y-0 data-[state=open]:opacity-100"
                : ""
            }
            data-state={
              pastEvents.some((pastEvent) => pastEvent.id === event.id)
                ? showPastEvents
                  ? "open"
                  : "closed"
                : "open"
            }
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>

      {pastEvents.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowPastEvents((value) => !value)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPastEvents ? "Hide Past Events" : "Show Past Events"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
