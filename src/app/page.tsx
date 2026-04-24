import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        navLinks={[
          { href: "/shop", label: "Shop Paint Kits" },
          { href: "/host", label: "Host Events" },
          { href: "/events", label: "Find an Event" },
        ]}
      />

      <main className="flex min-h-screen items-center px-4 pt-24">
        <section className="container mx-auto max-w-4xl py-20 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Paint &amp; Sip Depot
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">
            Landing page placeholder
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            This base URL is ready for the public landing page. The host experience has moved
            to <span className="font-semibold text-foreground">/host</span>.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/host">
              <Button size="lg" className="px-8 py-6 text-lg">
                Go to Host Page
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Shop Canvases
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
