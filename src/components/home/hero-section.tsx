import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-visible px-4 py-20">
      <div className="absolute inset-x-0 bottom-0 top-[73px] z-0 overflow-hidden">
        <Image
          src="/header/background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover blur-[1px]"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[73px] z-[1] bg-gradient-to-b from-black/30 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-[-1px] z-0 overflow-hidden leading-none">
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="block h-24 w-full md:h-32 lg:h-40"
          aria-hidden="true"
        >
          <path
            fill="#ffffff"
            d="M0,118C72,92,144,67,237,71C330,75,443,109,560,131C677,153,798,162,907,145C1015,128,1110,84,1207,77C1304,70,1404,100,1440,115L1440,220L0,220Z"
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-white md:text-7xl">
          Create Unforgettable Paint &amp; Sip Experiences
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg font-semibold text-white md:text-xl">
          Host stunning paint and sip events with ease. Manage event listings, ticket sales,
          and confirmations from one simple dashboard.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="px-8 py-6 text-lg">Start Hosting Events</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
