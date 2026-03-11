import { getCanvasGallerySections } from "@/lib/canvas-gallery";
import { EventEditForm } from "@/components/events/event-edit-form";

export default async function NewEventPage() {
  const canvasSections = await getCanvasGallerySections();

  return (
    <EventEditForm
      mode="create"
      backHref="/dashboard/events"
      titleText="Create New Event"
      subtitleText="Set up your paint and sip event details"
      canvasSections={canvasSections}
    />
  );
}
