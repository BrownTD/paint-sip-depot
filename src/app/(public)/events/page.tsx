import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";
import { PublicEventCard } from "@/components/public/event-card";
import { FindEventCodeForm } from "@/components/public/find-event-code-form";
import { findEventByCode, getDiscoverableEvents, isLiveEvent, normalizeEventCode } from "@/lib/event-discovery";

export const metadata: Metadata = {
  title: "Find an Event",
  description: "Browse public events or enter an event code from your host",
};

export const dynamic = "force-dynamic";

type SearchParams = {
  code?: string;
  q?: string;
  format?: "ALL" | "IN_PERSON" | "VIRTUAL";
  when?: "ALL" | "THIS_WEEK";
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const code = params.code?.trim();
  const normalizedCode = code ? normalizeEventCode(code) : "";

  if (normalizedCode) {
    const matchedEvent = await findEventByCode(normalizedCode);

    if (matchedEvent && isLiveEvent(matchedEvent.startDateTime, matchedEvent.status)) {
      const target =
        matchedEvent.visibility === "PRIVATE" && matchedEvent.eventCode
          ? `/e/${matchedEvent.slug}?code=${encodeURIComponent(matchedEvent.eventCode)}`
          : `/e/${matchedEvent.slug}`;
      redirect(target);
    }
  }

  const events = await getDiscoverableEvents({
    query: params.q,
    format: params.format,
    when: params.when,
  });

  const noResults = events.length === 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(249,250,251,0.95)_0%,rgba(255,255,255,1)_30%,rgba(248,250,252,1)_100%)]">
      <PublicHeader
        links={[
          { href: "/", label: "Home" },
        ]}
        showFindEventLink={false}
      />

      <main className="px-4 pb-20 pt-32">
        <section className="container mx-auto">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Find an Event
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Browse public events or enter an event code from your host
            </p>
          </div>

          <div
            id="event-code"
            className="mx-auto mt-12 max-w-4xl rounded-[32px] border border-border/70 bg-card px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-10"
          >
            <FindEventCodeForm initialCode={normalizedCode} />
            {normalizedCode ? (
              <p className="mt-4 text-center text-sm text-destructive">
                We couldn&apos;t find an event with that code
              </p>
            ) : null}
          </div>
        </section>

        <section className="container mx-auto mt-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Public Event Browser
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                Explore what&apos;s happening next
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Browse beautiful public paint &amp; sip experiences, then jump straight into the booking page when something catches your eye.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <SlidersHorizontal className="h-4 w-4" />
                Filter scaffolds ready for expansion
              </div>
              {[
                { label: "All", href: "/events" },
                { label: "This Week", href: "/events?when=THIS_WEEK" },
                { label: "Virtual", href: "/events?format=VIRTUAL" },
                { label: "In Person", href: "/events?format=IN_PERSON" },
              ].map((chip) => (
                <Link key={chip.label} href={chip.href}>
                  <Button
                    variant={
                      (chip.label === "All" && !params.format && !params.when) ||
                      (chip.label === "This Week" && params.when === "THIS_WEEK") ||
                      (chip.label === "Virtual" && params.format === "VIRTUAL") ||
                      (chip.label === "In Person" && params.format === "IN_PERSON")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="rounded-full px-4"
                  >
                    {chip.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {noResults ? (
            <div className="mx-auto mt-14 max-w-2xl rounded-[32px] border border-dashed border-border bg-card/80 px-8 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Compass className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold">No public events live right now</h3>
              <p className="mt-3 text-muted-foreground">
                Check back soon or enter an event code from your host
              </p>
              <Link href="/events#event-code" className="mt-8 inline-block">
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
        </section>
      </main>
    </div>
  );
}
