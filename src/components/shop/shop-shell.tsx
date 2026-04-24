"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  Menu,
  Search,
  ShoppingCart,
  Mail,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrencyAmount } from "@/lib/money";
import { toast } from "@/components/ui/use-toast";

const shopAnnouncement =
  "🎨 Shop Paint Kits & Supplies · Everything You Need for Your Next Paint & Sip";

const socialIcons = [
  { name: "Facebook", href: "https://facebook.com", icon: "/social-icons/facebook.svg" },
  { name: "Instagram", href: "https://instagram.com", icon: "/social-icons/instagram.svg" },
  { name: "LinkedIn", href: "https://linkedin.com", icon: "/social-icons/linkedin.svg" },
  { name: "TikTok", href: "https://tiktok.com", icon: "/social-icons/tiktok.svg" },
  { name: "X", href: "https://x.com", icon: "/social-icons/X.svg" },
];

export type StorefrontNavCategory = {
  id: string;
  name: string;
  slug: string;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

type ShopCartItem = {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  colorOptionId: string | null;
  colorLabel: string | null;
  variantId: string | null;
  variantLabel: string | null;
  stripePriceId: string | null;
};

function getCategoryHref(category: StorefrontNavCategory) {
  return `/shop/category/${category.slug}`;
}

function getSubcategoryHref(category: StorefrontNavCategory, subcategory: StorefrontNavCategory["subcategories"][number]) {
  return `/shop/category/${category.slug}/${subcategory.slug}`;
}

type ShopCartContextValue = {
  items: ShopCartItem[];
  isOpen: boolean;
  addItem: (item: Omit<ShopCartItem, "id">) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function useShopCart() {
  const context = useContext(ShopCartContext);

  if (!context) {
    throw new Error("useShopCart must be used within ShopChrome");
  }

  return context;
}

function MobileNavigation({ categories }: { categories: StorefrontNavCategory[] }) {
  const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/host", label: "Host an Event" },
    { href: "/contact", label: "Contact" },
  ];

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
      <SheetContent side="left" className="w-[88%] max-w-sm rounded-r-[2rem] px-6 py-8">
        <SheetHeader className="mb-8 text-left">
          <SheetTitle className="font-display text-2xl uppercase tracking-tight">
            Paint &amp; Sip Depot
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-black/75 transition hover:bg-muted hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-px w-full bg-black/10" />

          <div className="space-y-3">
          {categories.map((category) => (
            <details
              key={category.id}
              className="group rounded-2xl bg-white/70 px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium">
                <span>{category.name}</span>
                <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
              </summary>

              {category.subcategories.length > 0 ? (
                <div className="mt-3 space-y-1 border-t border-black/10 pt-3">
                  <Link
                    href={getCategoryHref(category)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-black transition hover:bg-muted"
                  >
                    All {category.name}
                  </Link>
                  {category.subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      href={getSubcategoryHref(category, subcategory)}
                      className="block rounded-xl px-3 py-2 text-sm text-black/70 transition hover:bg-muted hover:text-black"
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href={getCategoryHref(category)}
                  className="mt-3 block rounded-xl border-t border-black/10 px-3 py-2 pt-3 text-sm text-black/70 transition hover:bg-muted hover:text-black"
                >
                  Shop {category.name}
                </Link>
              )}
            </details>
          ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HeaderActions({ categories }: { categories: StorefrontNavCategory[] }) {
  const { items, openCart } = useShopCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex items-center gap-1 text-foreground">
      <button
        type="button"
        onClick={openCart}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="h-4 w-4" />
        {totalItems > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
            {totalItems}
          </span>
        ) : null}
      </button>
      <MobileNavigation categories={categories} />
    </div>
  );
}

function ShopCartDrawer() {
  const { items, isOpen, closeCart, updateItemQuantity, removeItem, clearCart } = useShopCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const cartCurrency = items[0]?.currency ?? "usd";
  const totalLabel = items.length > 0 ? formatCurrencyAmount(subtotalCents, cartCurrency) : null;

  async function handleCheckout() {
    if (items.length === 0) {
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            colorOptionId: item.colorOptionId,
            quantity: item.quantity,
          })),
          customerName,
          customerEmail,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Cart checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Failed to start checkout.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <SheetContent
        side="right"
        hideClose
        className="flex h-full w-[92%] max-w-md flex-col overflow-hidden px-6 py-8"
      >
        <div className="flex items-center justify-between">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-2xl uppercase tracking-tight">
              Your Cart
            </SheetTitle>
          </SheetHeader>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length > 0 ? (
          <div className="mt-8 flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-black/10 pb-4 last:border-0 last:pb-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-28 w-24 object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-24 items-center justify-center text-sm text-black/35">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-lg font-semibold text-black">{item.productName}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/45 transition hover:bg-black hover:text-white"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.colorLabel ? (
                      <p className="mt-2 text-sm text-black/55">Color: {item.colorLabel}</p>
                    ) : null}
                    {item.variantLabel ? (
                      <p className="mt-1 text-sm text-black/55">{item.variantLabel}</p>
                    ) : null}
                    <p className="mt-2 text-sm font-medium text-black">
                      {formatCurrencyAmount(item.unitPriceCents, item.currency)}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-3 rounded-full bg-[#f3f1ef] px-3 py-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-black hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[2ch] text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, Math.min(25, item.quantity + 1))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-black hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-black">
                        {formatCurrencyAmount(item.unitPriceCents * item.quantity, item.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 shrink-0 space-y-3 border-t border-black/10 bg-background pt-6">
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Your name"
                className="h-12 rounded-full bg-[#f3f1ef] px-4"
              />
              <Input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-full bg-[#f3f1ef] px-4"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-semibold text-black">Total</span>
              <span className="text-2xl font-bold text-black">{totalLabel}</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={clearCart}
              className="h-11 w-full rounded-full text-black/65 hover:bg-[#f3f1ef] hover:text-black"
              disabled={isSubmitting}
            >
              Clear Cart
            </Button>

            <Button
              type="button"
              onClick={() => void handleCheckout()}
              className="h-12 w-full rounded-full bg-black text-sm font-semibold text-white hover:bg-black/95"
              disabled={isSubmitting || !customerName.trim() || !customerEmail.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Checkout"
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-10 text-sm text-black/55">Your cart is empty.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ShopAnnouncementBar() {
  return (
    <div className="overflow-hidden bg-black py-2 text-xs font-medium text-white">
      <div className="shop-announcement-marquee-track flex w-max min-w-full shrink-0 items-center whitespace-nowrap">
        {[0, 1].map((group) => (
          <div key={group} className="flex items-center">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={`${group}-${index}`} className="inline-flex items-center px-6">
                {shopAnnouncement}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShopHeader({ categories }: { categories: StorefrontNavCategory[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <Brand href="/shop" className="gap-2" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden lg:block">
            <div className="relative">
              <Input
                aria-label="Search products"
                placeholder="Search..."
                className="peer h-12 w-[220px] rounded-full border-black/5 bg-[#f4f4f4] px-4 pr-11 text-sm"
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 opacity-0 transition-opacity peer-placeholder-shown:opacity-100" />
            </div>
          </div>
          <HeaderActions categories={categories} />
        </div>
      </div>
    </header>
  );
}

export function ShopChrome({
  categories,
  children,
}: {
  categories: StorefrontNavCategory[];
  children: ReactNode;
}) {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<ShopCartContextValue>(
    () => ({
      items,
      isOpen,
      addItem: (nextItem) =>
        setItems((current) => {
          const existingItem = current.find(
            (item) =>
              item.productId === nextItem.productId &&
              item.variantId === nextItem.variantId &&
              item.colorOptionId === nextItem.colorOptionId,
          );

          if (!existingItem) {
            return [
              ...current,
              {
                ...nextItem,
                id: `${nextItem.productId}:${nextItem.variantId ?? "standard"}:${nextItem.colorOptionId ?? "default"}`,
              },
            ];
          }

          return current.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: Math.min(25, item.quantity + nextItem.quantity),
                }
              : item,
          );
        }),
      updateItemQuantity: (itemId, quantity) =>
        setItems((current) =>
          current.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                }
              : item,
          ),
        ),
      removeItem: (itemId) =>
        setItems((current) => current.filter((item) => item.id !== itemId)),
      clearCart: () => setItems([]),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [items, isOpen],
  );

  return (
    <ShopCartContext.Provider value={value}>
      <div className="min-h-screen bg-white text-black">
        <ShopAnnouncementBar />
        <ShopHeader categories={categories} />
        {children}
        <ShopCartDrawer />
      </div>
    </ShopCartContext.Provider>
  );
}

export function ShopNewsletterSection() {
  return (
    <section className="px-4 pb-14 pt-6 sm:pb-20">
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-black px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl uppercase leading-[0.92] tracking-tight text-white sm:text-5xl">
              Stay Up To Date About Our Latest Offers
            </h2>
          </div>

          <div className="w-full max-w-xl space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="email"
                placeholder="Enter your email address"
                className="h-12 rounded-full border-white/10 bg-white px-12 text-sm text-black placeholder:text-black/45"
              />
            </div>
            <Button className="h-12 w-full rounded-full bg-white text-sm font-medium text-black hover:bg-white/90">
              Subscribe to Newsletter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShopFooter() {
  const footerColumns = [
    {
      title: "Company",
      links: [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: "Host an Event", href: "/host" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Customer Support", href: "/contact" },
        { label: "Shipping", href: "/shipping-policy" },
        { label: "Returns", href: "/returns" },
        { label: "Submit a Return", href: "/returns/submit" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Event Ideas", href: "/events" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="border-t border-black/10 bg-[#f8f7f5] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_repeat(3,0.8fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 font-display text-3xl uppercase tracking-tight text-black transition hover:text-black/75"
            >
              <Image src="/Misc/logo.svg" alt="" width={40} height={40} />
              <span>Paint &amp; Sip Depot</span>
            </Link>
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

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/55">
                {column.title}
              </p>
              <ul className="mt-5 space-y-3 text-sm text-black/65">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-black">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-black/10 pt-6 text-sm text-black/50 sm:flex-row sm:items-center sm:justify-between">
          <p>Paint &amp; Sip Depot © {new Date().getFullYear()}. All Rights Reserved.</p>
          <p>Secure checkout powered by Stripe.</p>
        </div>
      </div>
    </footer>
  );
}
