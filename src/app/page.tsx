import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FloatingCanvasSection } from "@/components/home/floating-canvas-section";
import { HeroSection } from "@/components/home/hero-section";
import { PublicHeader } from "@/components/public/public-header";
import { UpcomingEventsSection } from "@/components/public/upcoming-events-section";
import { getDiscoverableEvents } from "@/lib/event-discovery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const upcomingEvents = await getDiscoverableEvents({ limit: 6 });

  return (
    <div className="min-h-screen">
      <PublicHeader links={[{ href: "#how-it-works", label: "How it works" }]} />

      <HeroSection />
      <FloatingCanvasSection />

      <section id="how-it-works" className="bg-muted/20 px-4 py-24 md:py-32">
        <div className="container mx-auto">
          <div className="mt-4 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
            {[
              {
                number: "1",
                title: "Create your host account",
                description:
                  "Set up your account and access your dashboard to manage your events, track guests, and keep everything organized in one place.",
                tones: "from-primary/12 via-primary/5 to-background",
                labels: ["Dashboard", "Upcoming events", "Recent bookings"],
                imageSrc: "/dashboard.png",
              },
              {
                number: "2",
                title: "Choose your canvas and publish your event",
                description:
                  "Pick a design, add your event details, and launch a booking page your guests can start registering for right away.",
                tones: "from-accent/20 via-primary/5 to-background",
                labels: ["Canvas library", "Event details", "Publish booking page"],
                imageSrc: "/Frame 61.png",
              },
              {
                number: "3",
                title: "Accept bookings and manage attendees",
                description:
                  "Collect payments online, track tickets, confirm guests, and stay on top of everything from your dashboard.",
                tones: "from-primary/10 via-accent/10 to-background",
                labels: ["Payments", "Guest confirmations", "Ticket tracking"],
                imageSrc: "/checkout.png",
              },
            ].map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl font-semibold md:text-2xl">{step.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground md:text-base">
                  {step.description}
                </p>

                <div className="mt-8 w-full rounded-3xl border bg-card p-5 shadow-sm">
                  <div
                    className={[
                      "min-h-[220px] rounded-2xl border border-border/70 bg-gradient-to-br p-5 text-left md:min-h-[240px]",
                      step.tones,
                    ].join(" ")}
                  >
                    {step.imageSrc ? (
                      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl md:min-h-[240px]">
                        <Image
                          src={step.imageSrc}
                          alt={step.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
                          <span className="h-2.5 w-2.5 rounded-full bg-primary/20" />
                          <span className="h-2.5 w-2.5 rounded-full bg-primary/10" />
                        </div>

                        <div className="mt-8 space-y-4">
                          {step.labels.map((label, index) => (
                            <div key={label} className="rounded-2xl bg-background/85 p-4 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10" />
                                <div className="flex-1">
                                  <div
                                    className="h-3 rounded-full bg-foreground/10"
                                    style={{ width: `${78 - index * 12}%` }}
                                  />
                                  <div
                                    className="mt-2 h-2 rounded-full bg-foreground/5"
                                    style={{ width: `${58 - index * 10}%` }}
                                  />
                                </div>
                              </div>
                              <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-[50px]">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-center md:p-16">
            <div className="relative">
              <h2 className="mb-4 font-display text-3xl font-bold text-white md:text-5xl">
                Ready to Host Your First Event?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
                Create your host account and start sharing event links with your audience.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
                  Create Your Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <UpcomingEventsSection events={upcomingEvents} />

      <footer className="border-t px-4 py-12">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link href="/" className="font-display text-sm font-semibold">
              Paint &amp; Sip Depot
            </Link>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground md:items-end">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <p>© {new Date().getFullYear()} Paint &amp; Sip Depot. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
