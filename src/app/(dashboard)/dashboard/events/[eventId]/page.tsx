import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { EventActions } from "@/components/event-actions";
import { EventEditForm } from "@/components/events/event-edit-form";

async function getEvent(eventId: string, hostId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, hostId },
    include: {
      _count: { select: { bookings: { where: { status: "PAID" } } } },
    },
  });
}

function isoToDate(iso?: string | Date | null) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isoToTime(iso?: string | Date | null) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  return d.toISOString().slice(11, 16); // HH:mm
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

  const ticketsSold = event._count.bookings;

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

      {/* Edit form (Manage = Edit) */}
      <EventEditForm
        mode="edit"
        eventId={event.id}
        ticketsSold={ticketsSold}
        backHref="/dashboard/events"
        showBackLink={false}
        titleText="Edit Event"
        subtitleText="Update your event details and save changes"
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
          ticketPrice: String(Math.round((event.ticketPriceCents ?? 0) / 100)),
          capacity: String(event.capacity ?? 0),
          salesCutoffHours: String(event.salesCutoffHours ?? "48"),
          refundPolicyText: event.refundPolicyText ?? "",
          canvasImageUrl: event.canvasImageUrl ?? "",
          canvasId: event.canvasId ?? "",
        }}
      />
    </div>
  );
}