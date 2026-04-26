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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
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
  {
    name: "Facebook",
    href: "https://www.facebook.com/MillenniumStudios1/",
    icon: "/social-icons/facebook.svg",
    iconSize: 14,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/paintsipdepot/",
    icon: "/social-icons/instagram.svg",
    iconSize: 16,
  },
  { name: "LinkedIn", href: "https://linkedin.com", icon: "/social-icons/linkedin.svg" },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@millenniumstudios",
    icon: "/social-icons/tiktok.svg",
    iconSize: 16,
  },
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

const SHOP_CART_STORAGE_KEY = "paint-sip-depot-shop-cart";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const areaCode = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const lineNumber = digits.slice(6, 10);

  if (digits.length <= 3) {
    return areaCode ? `(${areaCode}` : "";
  }

  if (digits.length <= 6) {
    return `(${areaCode}) ${prefix}`;
  }

  return `(${areaCode}) ${prefix}-${lineNumber}`;
}

function isValidEmailSyntax(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

function getCategoryHref(category: StorefrontNavCategory) {
  return `/shop/category/${category.slug}`;
}

function getSubcategoryHref(category: StorefrontNavCategory, subcategory: StorefrontNavCategory["subcategories"][number]) {
  return `/shop/category/${category.slug}/${subcategory.slug}`;
}

const paintKitSubcategoryOrder = [
  "girls-night",
  "couples-date-night",
  "faith-community",
  "kids-family",
  "sports-teams",
  "sororities",
  "fraternities",
  "mature-audience",
  "everyone-welcome",
];

function getOrderedPaintKitSubcategories(category: StorefrontNavCategory) {
  return [...category.subcategories].sort((a, b) => {
    const indexA = paintKitSubcategoryOrder.indexOf(a.slug);
    const indexB = paintKitSubcategoryOrder.indexOf(b.slug);

    if (indexA === -1 && indexB === -1) {
      return a.name.localeCompare(b.name);
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

type ShopCartContextValue = {
  items: ShopCartItem[];
  lastAddedItem: ShopCartItem | null;
  isCartNoticeOpen: boolean;
  addItem: (item: Omit<ShopCartItem, "id">) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  dismissCartNotice: () => void;
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
  const paintKitsCategory =
    categories.find((category) => category.id === "cat_canvases") ?? categories[0] ?? null;
  const supplyCategories = categories.filter((category) => category.id !== paintKitsCategory?.id);
  const paintKitSubcategories = paintKitsCategory
    ? getOrderedPaintKitSubcategories(paintKitsCategory)
    : [];

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
      <SheetContent
        side="left"
        hideClose
        className="flex h-full w-[88%] max-w-sm flex-col rounded-r-[2rem] px-6 py-8"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl uppercase tracking-tight">
            Paint &amp; Sip Depot
          </SheetTitle>
        </SheetHeader>
          <SheetClose asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetClose>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {paintKitsCategory ? (
              <details className="group rounded-2xl bg-white/70 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium">
                  <span>{paintKitsCategory.name}</span>
                  <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                </summary>

                {paintKitSubcategories.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    <Link
                      href={getCategoryHref(paintKitsCategory)}
                      className="block rounded-xl px-3 py-2 text-sm text-black/70 transition hover:bg-muted hover:text-black"
                    >
                      All
                    </Link>
                    {paintKitSubcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={getSubcategoryHref(paintKitsCategory, subcategory)}
                        className="block rounded-xl px-3 py-2 text-sm text-black/70 transition hover:bg-muted hover:text-black"
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={getCategoryHref(paintKitsCategory)}
                    className="mt-3 block rounded-xl px-3 py-2 text-sm text-black/70 transition hover:bg-muted hover:text-black"
                  >
                    Shop {paintKitsCategory.name}
                  </Link>
                )}
              </details>
            ) : null}

            {supplyCategories.length > 0 ? (
              <details className="group rounded-2xl bg-white/70 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium">
                  <span>Supplies</span>
                  <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                </summary>

                <div className="mt-3 space-y-1">
                  {supplyCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={getCategoryHref(category)}
                      className="block rounded-xl px-3 py-2 text-sm text-black/70 transition hover:bg-muted hover:text-black"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="mt-5 h-px w-full bg-black/10" />

          <div className="mt-4 space-y-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-1.5 text-xs font-medium text-black/65 transition hover:bg-muted hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HeaderActions({ categories }: { categories: StorefrontNavCategory[] }) {
  const { items } = useShopCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex items-center gap-1 text-foreground">
      <Link
        href="/shop/cart"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="h-4 w-4" />
        {totalItems > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
            {totalItems}
          </span>
        ) : null}
      </Link>
      <MobileNavigation categories={categories} />
    </div>
  );
}

export function ShopCartPageContent() {
  const { items, updateItemQuantity, removeItem, clearCart } = useShopCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartCurrency = items[0]?.currency ?? "usd";
  const totalLabel = items.length > 0 ? formatCurrencyAmount(subtotalCents, cartCurrency) : null;
  const hasValidCustomerEmail = isValidEmailSyntax(customerEmail);

  function handleContinueShopping() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/shop";
  }

  async function handleCheckout() {
    if (items.length === 0) {
      return;
    }

    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !hasValidCustomerEmail ||
      !shippingAddress.trim() ||
      !shippingCity.trim() ||
      !shippingState.trim() ||
      !shippingZip.trim() ||
      !shippingPhone.trim()
    ) {
      return;
    }

    if (totalItems > 50) {
      const shouldContinue = window.confirm(
        "This is a large supply order. Hosting an event may make this easier to manage. Select OK to continue checkout, or Cancel to visit the Host an Event page.",
      );

      if (!shouldContinue) {
        window.location.href = "/host";
        return;
      }
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
          shippingName: customerName,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZip,
          shippingPhone,
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
    <main className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleContinueShopping}
            className="w-fit rounded-full px-0 text-black hover:bg-transparent"
          >
              <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
              Continue Shopping
          </Button>
          <div className="sm:text-right">
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-black sm:text-5xl">
              Your Cart
            </h1>
            {items.length > 0 ? (
              <p className="mt-2 text-sm text-black/55">
                {totalItems} item{totalItems === 1 ? "" : "s"} ready for checkout
              </p>
            ) : null}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <section className="order-2 flex min-h-[620px] flex-col rounded-lg border border-black/10 bg-white p-5 lg:order-2 lg:p-6">
              <div className="shrink-0 space-y-3">
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
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  className="h-12 rounded-full bg-[#f3f1ef] px-4"
                />
                <Input
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  placeholder="Shipping address"
                  className="h-12 rounded-full bg-[#f3f1ef] px-4"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={shippingCity}
                    onChange={(event) => setShippingCity(event.target.value)}
                    placeholder="City"
                    className="h-12 rounded-full bg-[#f3f1ef] px-4"
                  />
                  <Input
                    value={shippingState}
                    onChange={(event) => setShippingState(event.target.value.toUpperCase())}
                    placeholder="SC"
                    maxLength={2}
                    className="h-12 rounded-full bg-[#f3f1ef] px-4"
                  />
                  <Input
                    value={shippingZip}
                    onChange={(event) => setShippingZip(event.target.value)}
                    placeholder="ZIP"
                    className="h-12 rounded-full bg-[#f3f1ef] px-4"
                  />
                </div>
                <Input
                  type="tel"
                  value={shippingPhone}
                  onChange={(event) => setShippingPhone(formatPhoneInput(event.target.value))}
                  placeholder="(123) 456-7890"
                  className="h-12 rounded-full bg-[#f3f1ef] px-4"
                />
              </div>

              <div className="mt-auto space-y-3 border-t border-black/10 pt-5">
                <div className="flex items-center justify-between">
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
                  disabled={
                    isSubmitting ||
                    !customerName.trim() ||
                    !customerEmail.trim() ||
                    !hasValidCustomerEmail ||
                    !shippingAddress.trim() ||
                    !shippingCity.trim() ||
                    !shippingState.trim() ||
                    !shippingZip.trim() ||
                    !shippingPhone.trim()
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2.5">
                      Checkout with
                      <Image
                        src="/Misc/Stripe wordmark - White.svg"
                        alt="Stripe"
                        width={72}
                        height={30}
                        className="h-5 w-auto"
                      />
                    </span>
                  )}
                </Button>
              </div>
            </section>

            <section className="order-1 flex flex-col rounded-lg border border-black/10 bg-white p-5 lg:order-1 lg:p-6">
              <div className="flex items-center justify-end">
                <span className="rounded-full bg-[#f3f1ef] px-3 py-1 text-xs font-semibold text-black/60">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 max-h-[27rem] space-y-4 overflow-y-auto pr-1">
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
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
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
            </section>
          </div>
        ) : (
          <div className="mt-10 rounded-lg border border-black/10 bg-[#f7f4ef] px-6 py-12 text-center">
            <p className="font-display text-3xl uppercase tracking-tight text-black">Your cart is empty</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/60">
              Add paint kits, canvases, or supplies and they will appear here for checkout.
            </p>
            <Button asChild className="mt-6 h-12 rounded-full bg-black px-6 text-white hover:bg-black/95">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

function ShopCartAddedNotice() {
  const { lastAddedItem, isCartNoticeOpen, dismissCartNotice } = useShopCart();
  const [renderedItem, setRenderedItem] = useState<ShopCartItem | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const isLeavingRef = useRef(false);
  const autoDismissTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  const dismissWithAnimation = useCallback(() => {
    if (isLeavingRef.current) {
      return;
    }

    isLeavingRef.current = true;
    setIsLeaving(true);

    if (autoDismissTimeoutRef.current !== null) {
      window.clearTimeout(autoDismissTimeoutRef.current);
      autoDismissTimeoutRef.current = null;
    }

    exitTimeoutRef.current = window.setTimeout(() => {
      dismissCartNotice();
      setRenderedItem(null);
      isLeavingRef.current = false;
      setIsLeaving(false);
      setDragOffset(0);
      exitTimeoutRef.current = null;
    }, 300);
  }, [dismissCartNotice]);

  useEffect(() => {
    if (!isCartNoticeOpen || !lastAddedItem) {
      return;
    }

    if (autoDismissTimeoutRef.current !== null) {
      window.clearTimeout(autoDismissTimeoutRef.current);
    }
    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    setRenderedItem(lastAddedItem);
    isLeavingRef.current = false;
    setIsLeaving(false);
    setDragOffset(0);
    autoDismissTimeoutRef.current = window.setTimeout(dismissWithAnimation, 5000);

    return () => {
      if (autoDismissTimeoutRef.current !== null) {
        window.clearTimeout(autoDismissTimeoutRef.current);
        autoDismissTimeoutRef.current = null;
      }
    };
  }, [dismissWithAnimation, isCartNoticeOpen, lastAddedItem]);

  useEffect(
    () => () => {
      if (autoDismissTimeoutRef.current !== null) {
        window.clearTimeout(autoDismissTimeoutRef.current);
      }
      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    },
    [],
  );

  if (!renderedItem) {
    return null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStartXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStartXRef.current === null) {
      return;
    }

    setDragOffset(Math.max(0, event.clientX - dragStartXRef.current));
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragStartXRef.current === null) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartXRef.current = null;

    if (dragOffset > 90) {
      dismissWithAnimation();
      return;
    }

    setDragOffset(0);
  }

  return (
    <div
      className={`fixed right-4 top-24 z-50 w-[calc(100vw-2rem)] max-w-sm touch-pan-y rounded-lg border border-black/10 bg-white p-4 shadow-2xl duration-300 ${
        isLeaving ? "animate-out slide-out-to-right-8 fade-out" : "animate-in slide-in-from-right-8 fade-in"
      }`}
      style={{
        transform: dragOffset ? `translateX(${dragOffset}px)` : undefined,
        opacity: dragOffset ? Math.max(0.25, 1 - dragOffset / 220) : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">Added to cart</p>
        <button
          type="button"
          onClick={dismissWithAnimation}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/45 transition hover:bg-black hover:text-white"
          aria-label="Dismiss cart notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-3">
        {renderedItem.imageUrl ? (
          <img
            src={renderedItem.imageUrl}
            alt={renderedItem.productName}
            className="h-20 w-16 shrink-0 object-cover"
          />
        ) : (
          <div className="flex h-20 w-16 shrink-0 items-center justify-center bg-[#f3f1ef] text-xs text-black/35">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-semibold leading-snug text-black">
            {renderedItem.productName}
          </p>
          {renderedItem.variantLabel ? (
            <p className="mt-1 text-sm text-black/55">{renderedItem.variantLabel}</p>
          ) : null}
          {renderedItem.colorLabel ? (
            <p className="mt-1 text-sm text-black/55">Color: {renderedItem.colorLabel}</p>
          ) : null}
          <p className="mt-2 text-sm font-medium text-black">Quantity: {renderedItem.quantity}</p>
        </div>
      </div>
      <Button asChild className="mt-4 h-11 w-full rounded-full bg-black text-white hover:bg-black/95">
        <Link href="/shop/cart" onClick={dismissWithAnimation}>
          View Cart
        </Link>
      </Button>
    </div>
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
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<ShopCartItem | null>(null);
  const [isCartNoticeOpen, setIsCartNoticeOpen] = useState(false);

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(SHOP_CART_STORAGE_KEY);
      if (storedItems) {
        setItems(JSON.parse(storedItems) as ShopCartItem[]);
      }
    } catch {
      setItems([]);
    } finally {
      setHasLoadedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCart) {
      return;
    }

    window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasLoadedCart, items]);

  const value = useMemo<ShopCartContextValue>(
    () => ({
      items,
      lastAddedItem,
      isCartNoticeOpen,
      addItem: (nextItem) => {
        const itemId = `${nextItem.productId}:${nextItem.variantId ?? "standard"}:${nextItem.colorOptionId ?? "default"}`;
        const addedItem = {
          ...nextItem,
          id: itemId,
        };

        setLastAddedItem(addedItem);
        setIsCartNoticeOpen(true);

        setItems((current) => {
          const existingItem = current.find(
            (item) =>
              item.productId === nextItem.productId &&
              item.variantId === nextItem.variantId &&
              item.colorOptionId === nextItem.colorOptionId,
          );

          if (!existingItem) {
            return [...current, addedItem];
          }

          return current.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + nextItem.quantity,
                }
              : item,
          );
        });
      },
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
      openCart: () => {
        window.location.href = "/shop/cart";
      },
      dismissCartNotice: () => setIsCartNoticeOpen(false),
    }),
    [items, lastAddedItem, isCartNoticeOpen],
  );

  return (
    <ShopCartContext.Provider value={value}>
      <div className="min-h-screen bg-white text-black">
        <ShopAnnouncementBar />
        <ShopHeader categories={categories} />
        {children}
        <ShopCartAddedNotice />
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
        { label: "Contact", href: "/contact" },
        { label: "Shipping", href: "/shipping-policy" },
        { label: "Returns", href: "/returns" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms" },
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
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={item.iconSize ?? 16}
                    height={item.iconSize ?? 16}
                  />
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
          <Image
            src="/Misc/Powered by Stripe - black.svg"
            alt="Powered by Stripe"
            width={150}
            height={34}
            className="h-[34px] w-[150px]"
          />
        </div>
      </div>
    </footer>
  );
}
