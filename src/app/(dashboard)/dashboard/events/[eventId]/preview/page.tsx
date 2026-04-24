import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getEventPreviewData(eventId: string, hostId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, hostId },
    select: {
      id: true,
      title: true,
      slug: true,
      visibility: true,
      eventCode: true,
    },
  });
}

export default async function EventPreviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await getEventPreviewData(eventId, session.user.id);
  if (!event) {
    notFound();
  }

  const previewPath =
    event.visibility === "PRIVATE" && event.eventCode
      ? `/e/${event.slug}?code=${encodeURIComponent(event.eventCode)}`
      : `/e/${event.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>

        <Link href={previewPath} target="_blank" rel="noreferrer">
          <Button variant="outline" className="rounded-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Live Page
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview Event Page</CardTitle>
          <CardDescription>
            This preview shows how guests will see {event.title}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            <iframe
              title={`Preview for ${event.title}`}
              src={previewPath}
              className="h-[80vh] w-full bg-white"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
