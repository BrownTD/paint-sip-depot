import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPaidTicketQuantity } from "@/lib/booking";
import { getCanvasGallerySections } from "@/lib/canvas-gallery";
import { prisma } from "@/lib/prisma";
import { formatDateInputValue, formatTimeInputValue } from "@/lib/utils";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { EventActions } from "@/components/event-actions";
import { EventEditForm } from "@/components/events/event-edit-form";
import { EventShareCard } from "@/components/dashboard/event-share-card";
import { Card, CardContent } from "@/components/ui/card";

async function getEvent(eventId: string, hostId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, hostId },
  });
}

function isoToDate(iso?: string | Date | null) {
  return formatDateInputValue(iso);
}

function isoToTime(iso?: string | Date | null) {
  return formatTimeInputValue(iso);
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const session = await auth();
  if (!session?.user?.id) return null;

  const event = await getEvent(eventId, session.user.id);
  if (!event) notFound();

  const ticketsSold = await getPaidTicketQuantity(prisma, event.id);
  const canvasSections = await getCanvasGallerySections();

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>
        <EventActions event={{ id: event.id, status: event.status, slug: event.slug }} />
      </div>

      <EventShareCard eventCode={event.eventCode ?? null} visibility={event.visibility} />

      {event.status === "CANCELED" ? (
        <Card className="border-destructive/25 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold">Event Canceled</h2>
              <p className="text-sm text-muted-foreground">
                This event has been canceled and can no longer be edited or published on public
                pages.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EventEditForm
          mode="edit"
          eventId={event.id}
          ticketsSold={ticketsSold}
          backHref="/dashboard/events"
          showBackLink={false}
          titleText="Edit Event"
          subtitleText="Update your event details and save changes"
          canvasSections={canvasSections}
          initialStatus={event.status}
          initialData={{
            title: event.title ?? "",
            description: event.description ?? "",
            startDate: isoToDate(event.startDateTime),
            startTime: isoToTime(event.startDateTime),
            endTime: isoToTime(event.endDateTime ?? null),
            locationName: event.locationName ?? "",
            address: event.address ?? "",
            city: event.city ?? "",
            state: event.state ?? "",
            zip: event.zip ?? "",
            visibility: event.visibility ?? "PUBLIC",
            eventFormat: event.eventFormat ?? "IN_PERSON",
            ticketPrice: String(Math.round((event.ticketPriceCents ?? 0) / 100)),
            capacity: String(event.capacity ?? 0),
            refundPolicyText: event.refundPolicyText ?? "",
            canvasImageUrl: event.canvasImageUrl ?? "",
            canvasName: event.canvasName ?? "",
          }}
        />
      )}
    </div>
  );
}
