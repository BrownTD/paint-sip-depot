import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FloatingCanvasSection } from "@/components/home/floating-canvas-section";
import { HeroSection } from "@/components/home/hero-section";
import { PublicHeader } from "@/components/public/public-header";
import { UpcomingEventsSection } from "@/components/public/upcoming-events-section";
import { GoogleReviewsSection } from "@/components/shop/google-reviews-section";
import { ShopFooter } from "@/components/shop/shop-shell";
import { getDiscoverableEvents } from "@/lib/event-discovery";

export const dynamic = "force-dynamic";

const hostSteps = [
  {
    number: "1",
    title: "Create your host account",
    description:
      "Set up your account and access your dashboard to manage your events, track guests, and keep everything organized in one place.",
    imageSrc: "/Misc/dashboard.png",
  },
  {
    number: "2",
    title: "Choose your canvas and publish your event",
    description:
      "Pick a design, add your event details, and launch a booking page your guests can start registering for right away.",
    imageSrc: "/Misc/Frame 61.png",
  },
  {
    number: "3",
    title: "Accept bookings and manage attendees",
    description:
      "Collect payments online, track tickets, confirm guests, and stay on top of everything from your dashboard.",
    imageSrc: "/Misc/checkout.png",
  },
];

export default async function HostPage() {
  const upcomingEvents = await getDiscoverableEvents({ limit: 6 });

  return (
    <div className="no-scrollbar h-screen snap-y snap-mandatory overflow-y-auto">
      <PublicHeader
        navLinks={[
          { href: "/shop", label: "Shop Paint Kits" },
          { href: "/events", label: "Find an Event" },
          { href: "#how-it-works", label: "How it works" },
          { href: "/login", label: "Login" },
        ]}
      />

      <div className="snap-start snap-always">
        <HeroSection />
      </div>
      <div id="how-it-works" className="snap-start snap-always">
        <FloatingCanvasSection />
      </div>

      {hostSteps.map((step) => (
        <section
          key={step.number}
          className="flex min-h-screen snap-start snap-always items-center bg-muted/20 px-4 py-20"
        >
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
            <div className="text-center md:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm md:mx-0">
                {step.number}
              </div>
              <h3 className="mt-6 text-2xl font-semibold md:text-4xl">{step.title}</h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:max-w-md md:text-lg md:leading-8">
                {step.description}
              </p>
            </div>

            <div className="relative min-h-[260px] w-full md:min-h-[430px]">
              <Image
                src={step.imageSrc}
                alt={step.title}
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-contain"
              />
            </div>
          </div>
        </section>
      ))}

      <section className="flex min-h-screen snap-start snap-always items-center justify-center bg-primary px-4 py-0 text-center">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="mb-8 font-display text-5xl font-bold leading-none text-white md:text-7xl lg:text-8xl">
            Ready to Host Your First Event?
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-2xl font-semibold leading-9 text-white/80 md:text-3xl md:leading-10">
            Create your host account and start sharing event links with your audience.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="h-16 rounded-full px-12 text-xl font-semibold md:h-20 md:px-16 md:text-2xl">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>

      {upcomingEvents.length > 0 ? (
        <div className="relative z-10 -mt-10 min-h-screen snap-start snap-always">
          <UpcomingEventsSection events={upcomingEvents} />
        </div>
      ) : null}

      <GoogleReviewsSection className="flex min-h-screen snap-start snap-always items-center py-12 sm:py-16 lg:min-h-[76vh] lg:pb-0" />

      <div data-host-footer className="snap-start snap-normal lg:-mt-16">
        <ShopFooter />
      </div>
    </div>
  );
}
