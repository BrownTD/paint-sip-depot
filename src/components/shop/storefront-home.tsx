import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Menu,
  Search,
  ShoppingCart,
  Star,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Shop", href: "#new-arrivals" },
  { label: "Canvases", href: "#browse-theme" },
  { label: "Themes", href: "#browse-theme" },
  { label: "Supplies", href: "#top-selling" },
  { label: "New Arrivals", href: "#new-arrivals" },
];

const stats = [
  { value: "10+", label: "Years in Business" },
  { value: "100+", label: "Canvas Options" },
  { value: "1,000+", label: "Happy Customers" },
];

const tickerItems = ["Canvases", "Easels", "Brushes", "Palettes", "Aprons"];

type StorefrontProduct = {
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  rating: number;
  sale?: string;
};

// Placeholder catalog data until the real shop feed is connected.
const newArrivals: StorefrontProduct[] = [
  {
    title: "Floral Canvas Kit",
    image: "/header/image.png",
    price: "$38",
    originalPrice: "$46",
    rating: 4.8,
    sale: "17% OFF",
  },
  {
    title: "Kids Party Canvas",
    image: "/header/tom.png",
    price: "$32",
    originalPrice: "$40",
    rating: 4.7,
    sale: "20% OFF",
  },
  {
    title: "Date Night Canvas Set",
    image: "/Misc/BackgroundHero.png",
    price: "$58",
    originalPrice: "$68",
    rating: 4.9,
  },
  {
    title: "Paint Party Apron",
    image: "/Misc/blankCanvas.png",
    price: "$18",
    originalPrice: "$24",
    rating: 4.6,
    sale: "25% OFF",
  },
];

const topSelling: StorefrontProduct[] = [
  {
    title: "Faith-Inspired Canvas",
    image: "/header/delta.png",
    price: "$42",
    originalPrice: "$52",
    rating: 4.9,
    sale: "19% OFF",
  },
  {
    title: "Brush Set Bundle",
    image: "/Misc/example.svg",
    price: "$24",
    rating: 4.5,
  },
  {
    title: "Blank Stretch Canvas",
    image: "/Misc/blankCanvas.png",
    price: "$16",
    originalPrice: "$22",
    rating: 4.7,
    sale: "27% OFF",
  },
  {
    title: "Acrylic Starter Kit",
    image: "/header/tennis.png",
    price: "$48",
    rating: 4.8,
  },
];

// These theme cards are wired for easy replacement when real theme imagery lands.
const themes = [
  { name: "Ladies", image: "/header/aka.png" },
  { name: "Kids", image: "/header/tom.png" },
  { name: "Couples", image: "/Misc/BackgroundHero.png" },
  { name: "Faith", image: "/header/delta.png" },
];

// TODO: Replace these placeholders with Facebook-sourced reviews once that integration is ready.
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

const socialIcons = [
  { name: "Facebook", href: "https://facebook.com", icon: "/social-icons/facebook.svg" },
  { name: "Instagram", href: "https://instagram.com", icon: "/social-icons/instagram.svg" },
  { name: "LinkedIn", href: "https://linkedin.com", icon: "/social-icons/linkedin.svg" },
  { name: "TikTok", href: "https://tiktok.com", icon: "/social-icons/tiktok.svg" },
  { name: "X", href: "https://x.com", icon: "/social-icons/X.svg" },
];

function Wordmark() {
  return (
    <Link href="/shop" className="inline-flex items-center gap-2 text-lg font-black tracking-tight">
      <span className="font-display text-[1.35rem] uppercase leading-none">Paint &amp; Sip Depot</span>
    </Link>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-1 text-foreground">
      {[Search, ShoppingCart, User].map((Icon, index) => (
        <button
          key={index}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"
          aria-label="Store action"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open shop menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88%] max-w-sm rounded-r-[2rem] border-r-black/10 px-6 py-8">
        <SheetHeader className="mb-8 space-y-3 text-left">
          <SheetTitle className="font-display text-2xl uppercase tracking-tight">
            Paint &amp; Sip Depot
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Shop canvases, kits, and supplies for your next paint night.
          </p>
        </SheetHeader>

        <div className="space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-4 text-base font-medium transition hover:bg-muted"
            >
              {item.label}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProductCard({
  title,
  image,
  price,
  originalPrice,
  rating,
  sale,
}: {
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  rating: number;
  sale?: string;
}) {
  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#f3f1ef] p-4 sm:p-5">
        <div className="relative aspect-[4/4.4] overflow-hidden rounded-[1.25rem]">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <div className="px-1 pt-4">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5 text-[#ffb000]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-current stroke-0" />
            ))}
          </div>
          <span>{rating.toFixed(1)}/5</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-foreground">{price}</span>
          {originalPrice ? (
            <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
          ) : null}
          {sale ? (
            <span className="rounded-full bg-[#fce6e6] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#b64747]">
              {sale}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProductSection({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: StorefrontProduct[];
}) {
  return (
    <section id={id} className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
            {title}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {items.map((item) => (
            <ProductCard key={item.title} {...item} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            className="h-12 rounded-full border-black/10 px-10 text-sm font-semibold"
          >
            View All
          </Button>
        </div>
      </div>
    </section>
  );
}

export function StorefrontHome() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="bg-black px-4 py-2 text-center text-xs font-medium text-white">
        Shop canvases, kits, and supplies for your next paint night.
      </div>

      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-6">
          <div className="flex items-center gap-3 lg:hidden">
            <MobileNavigation />
            <Wordmark />
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <Wordmark />
            <nav className="flex items-center gap-5 text-sm font-medium text-black/75">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-black">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
              <Input
                aria-label="Search products"
                placeholder="Search for canvases, kits, or supplies..."
                className="h-12 w-full min-w-[360px] rounded-full border-black/5 bg-[#f4f4f4] pl-11 pr-4 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="lg:hidden">
              <HeaderActions />
            </div>
            <div className="hidden lg:flex">
              <HeaderActions />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#f4f1ee] px-4 pb-10 pt-8 sm:pt-10 md:pb-14">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <div className="relative z-10">
              <span className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/70">
                Curated for events, gifting, and paint nights
              </span>
              <h1 className="mt-6 max-w-[10ch] font-display text-[3.2rem] uppercase leading-[0.88] tracking-tight text-black sm:text-[4.4rem] lg:text-[5.6rem]">
                Find a Canvas for Any Occasion
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-black/68 sm:text-lg">
                Browse our curated collection of canvases, paint party essentials, and creative
                supplies designed for events, classrooms, celebrations, and unforgettable paint
                and sip experiences.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-full px-8 text-sm font-semibold sm:min-w-[170px]">
                  <Link href="#new-arrivals">Shop Now</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-black/10 bg-white px-8 text-sm font-semibold"
                >
                  <Link href="#browse-theme">Browse Themes</Link>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 border-t border-black/10 pt-7 sm:grid-cols-3 sm:gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="sm:border-r sm:border-black/10 sm:pr-4 last:sm:border-r-0">
                    <p className="font-display text-4xl uppercase tracking-tight text-black">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-black/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-[2.25rem] border border-black/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.08)] sm:min-h-[520px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_28%)]" />
              <Image
                src="/Misc/BackgroundHero.png"
                alt="Paint & Sip Depot storefront hero"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/5" />
              <div className="absolute left-5 top-5 h-10 w-10 rounded-full border border-white/70 bg-white/35 backdrop-blur-sm" />
              <div className="absolute right-7 top-10 h-16 w-16 rounded-full border border-black/15 bg-white/80" />
              <div className="absolute bottom-6 left-6 max-w-[220px] rounded-[1.4rem] border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                  Best Seller
                </p>
                <p className="mt-2 text-lg font-semibold text-black">Paint Party Starter Bundle</p>
                <p className="mt-1 text-sm text-black/60">
                  Canvas, brushes, palettes, and event-ready extras in one polished kit.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black px-4 py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center font-display text-[1.7rem] uppercase tracking-tight text-white sm:text-[2.1rem]">
            {tickerItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <ProductSection id="new-arrivals" title="New Arrivals" items={newArrivals} />

        <div className="mx-auto max-w-7xl px-4">
          <div className="h-px bg-black/10" />
        </div>

        <ProductSection id="top-selling" title="Top Selling" items={topSelling} />

        <section id="browse-theme" className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#f3f1ef] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="text-center">
              <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
                Browse by Theme
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {themes.map((theme, index) => (
                <Link
                  key={theme.name}
                  href="#"
                  className={[
                    "group relative overflow-hidden rounded-[1.6rem] bg-white p-4 sm:p-5",
                    index === 2 ? "md:col-span-1" : "",
                  ].join(" ")}
                >
                  <div className="relative aspect-[1.55/1] overflow-hidden rounded-[1.3rem]">
                    <Image
                      src={theme.image}
                      alt={theme.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
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

        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
                Our Happy Customers
              </h2>
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-lg"
                  aria-label="Previous reviews"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-lg"
                  aria-label="Next reviews"
                >
                  →
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="rounded-[1.5rem] border border-black/10 bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-0.5 text-[#ffb000]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current stroke-0" />
                    ))}
                  </div>
                  <p className="mt-4 text-lg font-semibold text-black">{review.name}</p>
                  <p className="mt-3 text-sm leading-6 text-black/65">{review.quote}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 pt-6 sm:pb-20">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-black px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-4xl uppercase tracking-tight text-white sm:text-5xl">
                  Want to Host Your Own Paint and Sip Event?
                </h2>
                <p className="mt-4 text-base leading-7 text-white/70">
                  Start planning your own unforgettable paint and sip experience.
                </p>
              </div>

              <Button
                asChild
                className="h-12 rounded-full bg-white px-8 text-sm font-semibold text-black hover:bg-white/90"
              >
                <Link href="https://host.paintsipdepot.com">Visit Host Portal</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-[#f8f7f5] px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_repeat(3,0.8fr)]">
            <div>
              <p className="font-display text-3xl uppercase tracking-tight text-black">
                Paint &amp; Sip Depot
              </p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-black/60">
                We offer canvases, kits, and event supplies to help you create unforgettable
                paint and sip experiences.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {socialIcons.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:-translate-y-0.5"
                    aria-label={item.name}
                  >
                    <Image src={item.icon} alt={item.name} width={16} height={16} />
                  </Link>
                ))}
              </div>
            </div>

            {[
              {
                title: "Company",
                links: ["About", "Shop", "Themes", "Host an Event"],
              },
              {
                title: "Help",
                links: ["Customer Support", "Shipping", "Returns", "FAQ"],
              },
              {
                title: "Resources",
                links: ["Blog", "Event Ideas", "Canvas Guide", "Contact"],
              },
            ].map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/55">
                  {column.title}
                </p>
                <ul className="mt-5 space-y-3 text-sm text-black/65">
                  {column.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="transition hover:text-black">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-black/10 pt-6 text-sm text-black/50 sm:flex-row sm:items-center sm:justify-between">
            <p>Paint &amp; Sip Depot © {new Date().getFullYear()}. All Rights Reserved.</p>
            <p>Secure checkout and product collections coming soon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
