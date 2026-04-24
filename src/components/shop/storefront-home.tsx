"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ShopProductCard,
  type StorefrontProductCardData,
} from "@/components/shop/shop-product-card";
import {
  ShopChrome,
  ShopFooter,
  ShopNewsletterSection,
  type StorefrontNavCategory,
} from "@/components/shop/shop-shell";

const stats = [
  { value: "10+", label: "Years in Business" },
  { value: "100+", label: "Canvas Options" },
  { value: "1,000+", label: "Happy Customers" },
];

const tickerItems = ["Canvases", "Easels", "Brushes", "Palettes", "Aprons", "Paint"];

const reviews = [
  {
    name: "Sarah M.",
    quote:
      "The canvas quality and packaging felt premium. Everything arrived ready for our ladies night and the photos looked incredible.",
  },
  {
    name: "Malik C.",
    quote:
      "We ordered a mix of canvases and supplies for a team event and the whole setup felt polished from start to finish.",
  },
  {
    name: "Jasmine L.",
    quote:
      "The themed options made it easy to plan a birthday paint party fast. The kids kits were a huge hit.",
  },
  {
    name: "Alicia & Devon",
    quote:
      "Perfect for date night. The collection felt curated, the checkout was simple, and the final setup looked elevated.",
  },
];

type StorefrontTheme = {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  productCount: number;
};

function ProductSection({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: StorefrontProductCardData[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section id={id} className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
            {title}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-6">
          {items.map((item) => (
            <ShopProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function StorefrontHome({
  newArrivals,
  topSelling,
  themes,
  categories,
}: {
  newArrivals: StorefrontProductCardData[];
  topSelling: StorefrontProductCardData[];
  themes: StorefrontTheme[];
  categories: StorefrontNavCategory[];
}) {
  const hasProducts = newArrivals.length > 0 || topSelling.length > 0;
  const [mobileTickerIndex, setMobileTickerIndex] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setMobileTickerIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setMobileTickerIndex((current) => (current + 1) % tickerItems.length);
    }, 400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <ShopChrome categories={categories}>
      <main>
        <section className="relative overflow-hidden bg-[#f4f1ee] pb-10 pt-8 sm:pt-10 md:pb-14">
          <Image
            src="/Misc/backgroundmobile.png"
            alt="Paint & Sip Depot storefront hero"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_bottom] md:hidden"
          />
          <Image
            src="/Misc/BackgroundHero.png"
            alt="Paint & Sip Depot storefront hero"
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-center md:block"
          />
          <div className="absolute inset-0 hidden sm:block sm:bg-[linear-gradient(90deg,rgba(244,241,238,0.97)_0%,rgba(244,241,238,0.88)_35%,rgba(244,241,238,0.28)_60%,rgba(244,241,238,0.02)_100%)]" />
          <div className="absolute inset-0 hidden sm:block sm:bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_28%)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4">
            <div className="flex min-h-[92svh] items-start justify-center py-6 sm:min-h-[620px] sm:items-start sm:justify-start sm:py-10 lg:min-h-[660px] lg:py-12">
              <div className="relative mx-auto mt-2 max-w-[340px] rounded-[2rem] border border-white/35 bg-white/10 px-6 py-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.1)] backdrop-blur-xl before:absolute before:inset-[1px] before:rounded-[calc(2rem-1px)] before:bg-[linear-gradient(140deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.08)_42%,rgba(255,255,255,0.16)_100%)] before:content-[''] after:absolute after:-right-6 after:top-5 after:h-24 after:w-24 after:rounded-full after:bg-white/14 after:blur-2xl after:content-[''] sm:mx-0 sm:mt-0 sm:max-w-2xl sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-left sm:shadow-none sm:backdrop-blur-0 sm:before:hidden sm:after:hidden">
                <div className="relative z-10">
                  <h1 className="mx-auto mt-2 max-w-[13.5ch] font-display text-[3.35rem] uppercase leading-[0.9] tracking-tight text-black sm:mx-0 sm:mt-6 sm:text-[4.6rem] lg:text-[5.35rem]">
                    Find A Canvas
                    <br />
                    For Any Occasion
                  </h1>

                  <p className="mt-5 text-base leading-7 text-black/72 sm:hidden">
                    All-in-one paint &amp; sip kits, pre-drawn canvases, and supplies-ready to
                    go, no prep required. Start creating today.
                  </p>

                  <div className="mt-6 flex justify-center sm:justify-start">
                    <Button
                      asChild
                      className="h-12 min-w-[190px] rounded-full bg-black px-8 text-sm font-semibold text-white hover:bg-white hover:text-black active:bg-white active:text-black sm:min-w-[240px] sm:px-10"
                    >
                      <Link href="#new-arrivals">Shop Now</Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-10 hidden grid-cols-1 gap-6 border-t border-black/10 pt-7 sm:grid sm:grid-cols-3 sm:gap-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="sm:border-r sm:border-black/10 sm:pr-4 last:sm:border-r-0"
                    >
                      <p className="font-display text-4xl uppercase tracking-tight text-black">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-black/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black px-4 py-5">
          <div className="sm:hidden">
            <div className="relative h-11 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-center font-display text-[2.45rem] uppercase tracking-tight text-white">
                <span className="block w-full">{tickerItems[mobileTickerIndex]}</span>
              </div>
            </div>
          </div>

          <div className="hidden overflow-hidden sm:block">
            <div className="shop-marquee-track flex w-max items-center whitespace-nowrap font-display text-[2.1rem] uppercase tracking-tight text-white">
              {[0, 1].map((groupIndex) => (
                <div key={groupIndex} className="flex flex-none items-center">
                  {tickerItems.map((item) => (
                    <span key={`${groupIndex}-${item}`} className="inline-flex items-center px-5">
                      <span>{item}</span>
                      <span className="ml-5 text-white/70">•</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {!hasProducts ? (
          <section className="px-4 py-14 sm:py-20">
            <div className="mx-auto max-w-4xl rounded-[2rem] border border-dashed bg-[#f8f7f5] px-6 py-16 text-center">
              <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
                Shop Opening Soon
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-black/65">
                No active shop products are live yet. Add products from the admin dashboard to
                publish them here automatically.
              </p>
            </div>
          </section>
        ) : (
          <>
            <ProductSection id="new-arrivals" title="New Arrivals" items={newArrivals} />

            {topSelling.length > 0 ? (
              <>
                <div className="mx-auto max-w-7xl px-4">
                  <div className="h-px bg-black/10" />
                </div>
                <ProductSection id="top-selling" title="Top Selling" items={topSelling} />
              </>
            ) : null}
          </>
        )}

        {themes.length > 0 ? (
          <section id="browse-theme" className="px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#f3f1ef] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <div className="text-center">
                <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
                  Browse by Category
                </h2>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {themes.map((theme) => (
                  <Link
                    key={theme.id}
                    href="#new-arrivals"
                    className="group relative overflow-hidden rounded-[1.6rem] bg-white p-4 sm:p-5"
                  >
                    <div className="relative aspect-[1.55/1] overflow-hidden rounded-[1.3rem]">
                      {theme.imageUrls[0] ? (
                        <img
                          src={theme.imageUrls[0]}
                          alt={theme.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                          Theme image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent" />
                      <div className="absolute left-5 top-5">
                        <p className="font-display text-3xl uppercase tracking-tight text-black sm:text-4xl">
                          {theme.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
                Our Happy Customers
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="rounded-[1.5rem] border border-black/10 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.04)]"
                >
                  <p className="text-lg font-semibold text-black">{review.name}</p>
                  <p className="mt-3 text-sm leading-6 text-black/65">{review.quote}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ShopNewsletterSection />
      </main>

      <ShopFooter />
    </ShopChrome>
  );
}
