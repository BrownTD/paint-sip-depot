import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";
import { ShopFooter } from "@/components/shop/shop-shell";

export default function HomePage() {
  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-auto bg-background">
      <PublicHeader
        showBorder={false}
        navLinks={[
          { href: "/shop", label: "Shop Paint Kits" },
          { href: "/host", label: "Host an Event" },
          { href: "/events", label: "Find an Event" },
        ]}
      />

      <section className="relative flex h-screen w-full snap-start snap-always items-start justify-center bg-white pt-20 md:hidden">
        <video
          className="h-auto max-h-[calc(100svh-5rem)] w-auto max-w-[100%]"
          src="/landing-hero/Poster%2001%20Vectical_1.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/landing-hero/Poster%2001%20Vectical.00_00_00_00.Still003.png"
          aria-label="Paint and Sip Depot landing video"
        />
      </section>

      <section className="relative hidden h-screen w-full snap-start snap-always items-start justify-center bg-white pt-20 md:flex">
        <video
          className="h-auto max-h-[calc(100svh-5rem)] w-auto max-w-[90%]"
          src="/landing-hero/Poster%2001%20Wide.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/landing-hero/Poster%2001%20Wide.00_00_00_00.Still001.png"
          aria-label="Paint and Sip Depot landing video"
        />
      </section>

      <main className="flex h-screen snap-start snap-always items-center justify-center px-4 pt-20">
        <section className="container mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Paint &amp; Sip Depot
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">
            Paint, Sip, Create Magic
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Shop ready-to-paint kits, or host your own paint and sip
            event with supplies, booking tools, and support in one place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/host">
              <Button size="lg" className="px-8 py-6 text-lg">
                Host an Event
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Shop Paint Kits
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <div className="snap-start">
        <ShopFooter />
      </div>
    </div>
  );
}
