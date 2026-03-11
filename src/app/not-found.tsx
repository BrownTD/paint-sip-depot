import Link from "next/link";
import { Compass, Home, TicketX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(249,250,251,0.96)_0%,rgba(255,255,255,1)_28%,rgba(248,250,252,1)_100%)]">
      <PublicHeader
        links={[
          { href: "/", label: "Home" },
          { href: "/events", label: "Find an Event" },
        ]}
      />

      <main className="container mx-auto flex min-h-[calc(100vh-120px)] items-center px-4 pb-16 pt-28">
        <div className="mx-auto max-w-3xl rounded-[36px] border border-border/70 bg-card px-8 py-14 text-center shadow-[0_30px_90px_rgba(15,23,42,0.08)] md:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <TicketX className="h-10 w-10 text-primary" />
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.26em] text-primary">
            404
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            That page is not available.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The link may be invalid, expired, or the event is no longer active. Use the options
            below to get back on track.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="/events">
                <Compass className="mr-2 h-4 w-4" />
                Browse Events
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
