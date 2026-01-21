import { EventEditForm } from "@/components/events/event-edit-form";

export default function NewEventPage() {
  return (
    <EventEditForm
      mode="create"
      backHref="/dashboard/events"
      titleText="Create New Event"
      subtitleText="Set up your paint and sip event details"
    />
  );
}