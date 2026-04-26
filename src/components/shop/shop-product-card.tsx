"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingBag, Star } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StorefrontProductCardData = {
  id: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryName: string | null;
  imageUrls: string[];
  isCouples: boolean;
  priceDisplay: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number;
  colorOptions: Array<{
    id: string;
    label: string;
    hex: string;
  }>;
  variants: Array<{
    id: string;
    size: "MEDIUM" | "LARGE";
    label: string;
    priceCents: number;
    currency: string;
    stripePriceId: string | null;
    isDefault: boolean;
  }>;
};

function renderProductDescription(description: string) {
  const blocks = description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const bulletLines = lines.filter((line) => line.startsWith("* "));

    if (bulletLines.length === lines.length) {
      return (
        <ul key={`description-block-${index}`} className="space-y-2 pl-5">
          {bulletLines.map((line) => (
            <li key={line} className="list-disc">
              {line.slice(2)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`description-block-${index}`} className="leading-7">
        {lines.join(" ")}
      </p>
    );
  });
}

function ProductCardStars({ rating, reviewCount }: { rating: number | null; reviewCount: number }) {
  const safeRating = rating ?? 0;
  const fullStars = Math.floor(safeRating);
  const hasHalf = safeRating - fullStars >= 0.5;

  return (
    <div className="mt-2 flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < fullStars;
        const isHalf = index === fullStars && hasHalf;

        return (
          <Star
            key={index}
            className={cn(
              "h-4 w-4",
              isFilled || isHalf ? "fill-[#fbbf24] text-[#fbbf24]" : "fill-transparent text-[#d1d5db]",
            )}
          />
        );
      })}
      {reviewCount > 0 && rating ? (
        <span className="ml-1 text-sm text-black/55">{formatDisplayedRating(rating)}/5</span>
      ) : null}
    </div>
  );
}

function formatDisplayedRating(rating: number | null) {
  if (rating == null) {
    return null;
  }

  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

export function ShopProductCard({
  product,
}: {
  product: StorefrontProductCardData;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ?? product.variants[0] ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ?? "");
  const [selectedColorOptionId, setSelectedColorOptionId] = useState(
    product.colorOptions[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) ?? defaultVariant,
    [defaultVariant, product.variants, selectedVariantId],
  );
  const quantityNumber = Math.max(1, Number.parseInt(quantity || "1", 10) || 1);
  const hasVariants = product.variants.length > 0;
  const isPaintProduct = product.categoryId === "cat_paint";
  const hasSelectableColorOptions = isPaintProduct && product.colorOptions.length > 0;
  const unitPriceCents = selectedVariant?.priceCents ?? product.priceCents;
  const checkoutCurrency = selectedVariant?.currency ?? product.currency;
  const selectedImageUrl = product.imageUrls[selectedImageIndex] ?? product.imageUrls[0] ?? null;
  const discountPercent =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round(((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100)
      : null;

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedColorOptionId(product.colorOptions[0]?.id ?? "");
  }, [product.id, isDialogOpen]);

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasVariants && !selectedVariant) {
      toast({
        title: "Size required",
        description: "Choose a product size before continuing to checkout.",
        variant: "destructive",
      });
      return;
    }

    if (hasVariants && !selectedVariant?.stripePriceId) {
      toast({
        title: "Checkout unavailable",
        description:
          "This product size is not available for checkout yet. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (hasSelectableColorOptions && !selectedColorOptionId) {
      toast({
        title: "Color required",
        description: "Choose a color before continuing to checkout.",
        variant: "destructive",
      });
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
          productId: product.id,
          variantId: selectedVariant?.id ?? null,
          colorOptionId: hasSelectableColorOptions ? selectedColorOptionId || null : null,
          quantity: quantityNumber,
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
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Failed to start checkout.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <article className="group">
        <Link href={`/shop/${product.id}`} className="block">
          {product.imageUrls.length > 0 ? (
            product.isCouples && product.imageUrls.length >= 2 ? (
              <div className="grid aspect-[3/4] grid-cols-2 gap-2">
                {product.imageUrls.slice(0, 2).map((imageUrl, index) => (
                  <img
                    key={`${product.id}-${index}`}
                    src={imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <img
                src={product.imageUrls[0]}
                alt={product.name}
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
            )
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center text-sm text-black/45">
              No image
            </div>
          )}
        </Link>

        <div className="px-1 pt-4">
          <Link href={`/shop/${product.id}`} className="block">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">
              {product.name}
            </h3>
          </Link>

          {product.colorOptions.length > 0 ? (
            <div className="mt-2 flex items-center gap-1.5">
              {product.colorOptions.slice(0, 3).map((colorOption) => (
                <span
                  key={colorOption.id}
                  className="h-5 w-5 rounded-full border border-black/10"
                  style={{ backgroundColor: colorOption.hex }}
                  title={colorOption.label}
                />
              ))}
              {product.colorOptions.length > 3 ? (
                <span className="text-xs font-semibold text-black/55">
                  +{product.colorOptions.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          <ProductCardStars rating={product.rating} reviewCount={product.reviewCount} />

          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-foreground">{product.priceDisplay}</p>
              {product.compareAtCents ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-black/35 line-through">
                    {formatCurrencyAmount(product.compareAtCents, product.currency)}
                  </span>
                  {discountPercent ? (
                    <span className="rounded-full bg-[#fef2f2] px-2 py-0.5 text-[11px] font-semibold text-[#ef4444]">
                      -{discountPercent}%
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            className="mt-4 w-full border-transparent bg-black text-white hover:border-transparent hover:bg-white hover:text-black active:border-transparent active:bg-white active:text-black"
            onClick={() => setIsDialogOpen(true)}
          >
            Buy Now
          </Button>
        </div>
      </article>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-h-[85vh] sm:max-w-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6">
            <div className="space-y-3">
              {selectedImageUrl ? (
                <>
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden">
                    <img
                      src={selectedImageUrl}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {product.imageUrls.length > 1 ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {product.imageUrls.map((imageUrl, index) => (
                        <button
                          key={`${product.id}-dialog-thumb-${index}`}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          className={`overflow-hidden transition ${
                            selectedImageIndex === index
                              ? "opacity-100"
                              : "opacity-65 hover:opacity-100"
                          }`}
                          aria-label={`View image ${index + 1} for ${product.name}`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            className="aspect-square h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}

              <div className="space-y-4 text-sm text-muted-foreground">
                {renderProductDescription(product.description)}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCheckout}>
              {hasVariants ? (
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a size" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.label} ·{" "}
                          {formatCurrencyAmount(variant.priceCents, variant.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {hasSelectableColorOptions ? (
                <div className="space-y-3">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {product.colorOptions.map((colorOption) => {
                      const isSelected = selectedColorOptionId === colorOption.id;

                      return (
                        <button
                          key={colorOption.id}
                          type="button"
                          onClick={() => setSelectedColorOptionId(colorOption.id)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                            isSelected
                              ? "border-black bg-black text-white"
                              : "border-black/10 bg-[#f3f1ef] text-black hover:border-black/25"
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{ backgroundColor: colorOption.hex }}
                            aria-hidden="true"
                          />
                          {colorOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor={`quantity-${product.id}`}>Quantity</Label>
                <Input
                  id={`quantity-${product.id}`}
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`customer-name-${product.id}`}>Name</Label>
                <Input
                  id={`customer-name-${product.id}`}
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Your name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`customer-email-${product.id}`}>Email</Label>
                <Input
                  id={`customer-email-${product.id}`}
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`shipping-address-${product.id}`}>Shipping Address</Label>
                <Input
                  id={`shipping-address-${product.id}`}
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  placeholder="Street address"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor={`shipping-city-${product.id}`}>City</Label>
                  <Input
                    id={`shipping-city-${product.id}`}
                    value={shippingCity}
                    onChange={(event) => setShippingCity(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`shipping-state-${product.id}`}>State</Label>
                  <Input
                    id={`shipping-state-${product.id}`}
                    value={shippingState}
                    onChange={(event) => setShippingState(event.target.value.toUpperCase())}
                    maxLength={2}
                    placeholder="SC"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`shipping-zip-${product.id}`}>ZIP</Label>
                  <Input
                    id={`shipping-zip-${product.id}`}
                    value={shippingZip}
                    onChange={(event) => setShippingZip(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`shipping-phone-${product.id}`}>Phone</Label>
                <Input
                  id={`shipping-phone-${product.id}`}
                  type="tel"
                  value={shippingPhone}
                  onChange={(event) => setShippingPhone(event.target.value)}
                  placeholder="Phone for shipping"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-lg font-semibold text-foreground sm:text-xl">Total</span>
                  <span className="text-2xl font-bold text-foreground sm:text-3xl">
                    {formatCurrencyAmount(unitPriceCents * quantityNumber, checkoutCurrency)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  (hasVariants && !selectedVariant?.stripePriceId) ||
                  !customerName.trim() ||
                  !customerEmail.trim() ||
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
                  <>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continue to Checkout
                  </>
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
