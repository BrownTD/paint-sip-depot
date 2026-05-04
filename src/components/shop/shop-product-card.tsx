"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/money";
import { getGroundAdvantageLabel } from "@/lib/shipping-display";
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
  couplesBundleName: string | null;
  couplesSlot: number | null;
  couplesPairProduct: {
    id: string;
    name: string;
    imageUrls: string[];
    priceCents: number;
    currency: string;
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
  } | null;
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

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const areaCode = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const lineNumber = digits.slice(6, 10);

  if (digits.length <= 3) return areaCode ? `(${areaCode}` : "";
  if (digits.length <= 6) return `(${areaCode}) ${prefix}`;
  return `(${areaCode}) ${prefix}-${lineNumber}`;
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
  const firstColorOptionId = useMemo(
    () => product.colorOptions[0]?.id ?? "",
    [product.colorOptions],
  );
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ?? "");
  const [selectedColorOptionId, setSelectedColorOptionId] = useState(
    firstColorOptionId,
  );
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingEstimate, setShippingEstimate] = useState<{
    amountCents: number;
    service: string;
    estimateLabel: string;
  } | null>(null);
  const [shippingEstimateError, setShippingEstimateError] = useState("");
  const [isLoadingShippingEstimate, setIsLoadingShippingEstimate] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) ?? defaultVariant,
    [defaultVariant, product.variants, selectedVariantId],
  );
  const pairedVariant = useMemo(() => {
    if (!product.couplesPairProduct || !selectedVariant) {
      return null;
    }

    return (
      product.couplesPairProduct.variants.find((variant) => variant.size === selectedVariant.size) ??
      product.couplesPairProduct.variants.find((variant) => variant.isDefault) ??
      product.couplesPairProduct.variants[0] ??
      null
    );
  }, [product.couplesPairProduct, selectedVariant]);
  const quantityNumber = Math.max(1, Number.parseInt(quantity || "1", 10) || 1);
  const hasVariants = product.variants.length > 0;
  const isPaintProduct = product.categoryId === "cat_paint";
  const hasSelectableColorOptions = isPaintProduct && product.colorOptions.length > 0;
  const unitPriceCents = selectedVariant?.priceCents ?? product.priceCents;
  const pairedUnitPriceCents = pairedVariant?.priceCents ?? product.couplesPairProduct?.priceCents ?? 0;
  const checkoutCurrency = selectedVariant?.currency ?? product.currency;
  const lineSubtotalCents = (unitPriceCents + (product.couplesPairProduct ? pairedUnitPriceCents : 0)) * quantityNumber;
  const shippingCents = shippingEstimate?.amountCents ?? 0;
  const totalBeforeTaxCents = lineSubtotalCents + shippingCents;
  const selectedImageUrl = product.imageUrls[selectedImageIndex] ?? product.imageUrls[0] ?? null;
  const couplesPreviewImageUrls = product.couplesPairProduct
    ? [product.imageUrls[0], product.couplesPairProduct.imageUrls[0]].filter((imageUrl): imageUrl is string => Boolean(imageUrl))
    : product.imageUrls.slice(0, 2);
  const couplesColorGroups = product.couplesPairProduct
    ? [product.colorOptions, product.couplesPairProduct.colorOptions]
    : [product.colorOptions];
  const hasCompleteShippingAddress =
    Boolean(shippingAddress.trim()) &&
    Boolean(shippingCity.trim()) &&
    shippingState.trim().length === 2 &&
    shippingZip.trim().length >= 5;
  const discountPercent =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round(((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100)
      : null;

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedColorOptionId(firstColorOptionId);
  }, [firstColorOptionId, product.id, isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen || !hasCompleteShippingAddress) {
      setShippingEstimate(null);
      setShippingEstimateError("");
      setIsLoadingShippingEstimate(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoadingShippingEstimate(true);
      setShippingEstimateError("");

      fetch("/api/shop/shipping-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          items: [
            {
              productId: product.id,
              variantId: selectedVariant?.id ?? null,
              colorOptionId: hasSelectableColorOptions ? selectedColorOptionId || null : null,
              quantity: quantityNumber,
            },
            ...(product.couplesPairProduct
              ? [
                  {
                    productId: product.couplesPairProduct.id,
                    variantId: pairedVariant?.id ?? null,
                    colorOptionId: null,
                    quantity: quantityNumber,
                  },
                ]
              : []),
          ],
          shippingName: "Paint & Sip Depot Customer",
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZip,
        }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to load shipping estimate.");
          setShippingEstimate(data as { amountCents: number; service: string; estimateLabel: string });
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setShippingEstimate(null);
          setShippingEstimateError(error instanceof Error ? error.message : "Failed to load shipping estimate.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingShippingEstimate(false);
        });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    hasCompleteShippingAddress,
    hasSelectableColorOptions,
    isDialogOpen,
    product.id,
    product.couplesPairProduct,
    quantityNumber,
    pairedVariant?.id,
    selectedColorOptionId,
    selectedVariant?.id,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingZip,
  ]);

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

    if (product.couplesPairProduct && !pairedVariant?.stripePriceId) {
      toast({
        title: "Checkout unavailable",
        description:
          "The paired canvas size is not available for checkout yet. Please contact support.",
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
          items: [
            {
              productId: product.id,
              variantId: selectedVariant?.id ?? null,
              colorOptionId: hasSelectableColorOptions ? selectedColorOptionId || null : null,
              quantity: quantityNumber,
            },
            ...(product.couplesPairProduct
              ? [
                  {
                    productId: product.couplesPairProduct.id,
                    variantId: pairedVariant?.id ?? null,
                    colorOptionId: null,
                    quantity: quantityNumber,
                  },
                ]
              : []),
          ],
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
            product.isCouples && couplesPreviewImageUrls.length >= 2 ? (
              <div className="grid aspect-[3/4] grid-cols-2 gap-[3px] overflow-hidden">
                {couplesPreviewImageUrls.map((imageUrl, index) => (
                  <Image
                    key={`${product.id}-couples-preview-${index}`}
                    src={imageUrl}
                    alt={index === 0 ? product.name : product.couplesPairProduct?.name ?? `${product.name} canvas 2`}
                    width={450}
                    height={1200}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                    unoptimized
                  />
                ))}
              </div>
            ) : (
              <Image
                src={product.imageUrls[0]}
                alt={product.name}
                width={900}
                height={1200}
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                loading="lazy"
                unoptimized
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
              {product.couplesPairProduct && product.couplesBundleName ? product.couplesBundleName : product.name}
            </h3>
          </Link>

          {product.isCouples && product.couplesPairProduct ? (
            <div className="mt-2 grid grid-cols-2 gap-[3px]">
              {couplesColorGroups.map((colorOptions, groupIndex) => (
                <div key={`${product.id}-color-group-${groupIndex}`} className="flex min-w-0 items-center gap-1.5">
                  {colorOptions.slice(0, 3).map((colorOption) => (
                    <span
                      key={colorOption.id}
                      className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: colorOption.hex }}
                      title={colorOption.label}
                    />
                  ))}
                  {colorOptions.length > 3 ? (
                    <span className="truncate text-xs font-semibold text-black/55">
                      +{colorOptions.length - 3}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : product.colorOptions.length > 0 ? (
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
            <DialogTitle>
              {product.couplesPairProduct && product.couplesBundleName ? product.couplesBundleName : product.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6">
            <div className="space-y-3">
              {product.isCouples && couplesPreviewImageUrls.length >= 2 ? (
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={couplesPreviewImageUrls[1]}
                    alt={product.couplesPairProduct?.name ?? `${product.name} canvas 2`}
                    width={900}
                    height={1200}
                    className="absolute left-[17%] top-[7%] h-[86%] w-[76%] object-cover shadow-sm"
                    unoptimized
                  />
                  <Image
                    src={couplesPreviewImageUrls[0]}
                    alt={product.name}
                    width={900}
                    height={1200}
                    className="absolute left-[7%] top-[3%] z-10 h-[86%] w-[76%] object-cover shadow-md"
                    unoptimized
                  />
                </div>
              ) : selectedImageUrl ? (
                <>
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden">
                    <Image
                      src={selectedImageUrl}
                      alt={product.name}
                      width={900}
                      height={1200}
                      className="h-full w-full object-contain"
                      unoptimized
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
                          <Image
                            src={imageUrl}
                            alt={`${product.name} thumbnail ${index + 1}`}
                            width={160}
                            height={160}
                            className="aspect-square h-full w-full object-cover"
                            unoptimized
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
                  <Label>Paint Color</Label>
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
                  onChange={(event) => setShippingPhone(formatPhoneInput(event.target.value))}
                  placeholder="(123) 456-7890"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                {isLoadingShippingEstimate ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading delivery estimate...
                  </div>
                ) : shippingEstimate ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-foreground">
                        {getGroundAdvantageLabel(shippingEstimate.service)}:
                      </span>
                      <span className="font-medium">{formatCurrencyAmount(shippingCents, checkoutCurrency)}</span>
                    </div>
                    <p className="text-base font-medium text-muted-foreground">{shippingEstimate.estimateLabel}</p>
                  </div>
                ) : shippingEstimateError ? (
                  <p className="text-destructive">{shippingEstimateError}</p>
                ) : (
                  <p className="text-muted-foreground">Enter the shipping address to estimate delivery.</p>
                )}
              </div>

              <div className="pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Purchase</span>
                    <span>{formatCurrencyAmount(lineSubtotalCents, checkoutCurrency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>{hasCompleteShippingAddress ? formatCurrencyAmount(shippingCents, checkoutCurrency) : "Enter address"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Taxes</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t pt-3">
                    <span className="text-lg font-semibold text-foreground sm:text-xl">Total before tax</span>
                    <span className="text-2xl font-bold text-foreground sm:text-3xl">
                      {formatCurrencyAmount(totalBeforeTaxCents, checkoutCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  (hasVariants && !selectedVariant?.stripePriceId) ||
                  Boolean(product.couplesPairProduct && !pairedVariant?.stripePriceId) ||
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
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
