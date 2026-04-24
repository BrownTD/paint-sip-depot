"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, Minus, Plus, SlidersHorizontal, Star } from "lucide-react";
import { formatCurrencyAmount } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

type ProductDetailBreadcrumb = {
  label: string;
  href?: string;
};

type ProductDetailColorOption = {
  id: string;
  label: string;
  hex: string;
};

type ProductDetailSizeOption = {
  id: string;
  label: string;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  isDefault?: boolean;
};

type ProductDetailReview = {
  id: string;
  name: string;
  rating: number;
  body: string;
  dateLabel: string;
  verified: boolean;
  imageUrl: string | null;
  createdAt: string;
};

type ProductDetailFaq = {
  id: string;
  question: string;
  answer: string;
};

type ProductDetailRelatedProduct = {
  id: string;
  href: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number;
};

export type ProductDetailData = {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  imageUrls: string[];
  breadcrumbs: ProductDetailBreadcrumb[];
  rating: number | null;
  reviewCount: number;
  priceCents: number;
  discountPercent: number | null;
  currency: string;
  stripePriceId: string | null;
  categoryName: string;
  subcategoryName: string | null;
  colorOptions: ProductDetailColorOption[];
  sizeOptions: ProductDetailSizeOption[];
  reviews: ProductDetailReview[];
  faqs: ProductDetailFaq[];
  relatedProducts: ProductDetailRelatedProduct[];
};

type AddToCartPayload = {
  productId: string;
  colorId: string | null;
  colorLabel: string | null;
  sizeId: string | null;
  quantity: number;
  stripePriceId: string | null;
};

function renderRichDescription(description: string) {
  const blocks = description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const bulletLines = lines.filter((line) => line.startsWith("* "));

    if (bulletLines.length === lines.length) {
      return (
        <ul key={`detail-description-${index}`} className="space-y-2 pl-5">
          {bulletLines.map((line) => (
            <li key={line} className="list-disc text-sm leading-7 text-black/65">
              {line.slice(2)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`detail-description-${index}`} className="text-sm leading-7 text-black/65">
        {lines.join(" ")}
      </p>
    );
  });
}

function getDiscountPercent(priceCents: number, compareAtCents: number | null) {
  if (!compareAtCents || compareAtCents <= priceCents) {
    return null;
  }

  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

function getCompareAtCents(priceCents: number, discountPercent: number | null) {
  if (!discountPercent) {
    return null;
  }

  const denominator = 1 - discountPercent / 100;
  if (denominator <= 0) {
    return null;
  }

  return Math.round(priceCents / denominator);
}

function formatDisplayedRating(rating: number | null) {
  if (rating == null) {
    return null;
  }

  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function RatingStars({ rating, className }: { rating: number | null; className?: string }) {
  const safeRating = rating ?? 0;
  const fullStars = Math.floor(safeRating);
  const hasHalf = safeRating - fullStars >= 0.5;

  return (
    <div className={cn("flex items-center gap-1 text-[#fbbf24]", className)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < fullStars;
        const isHalf = index === fullStars && hasHalf;

        return (
          <Star
            key={index}
            className={cn(
              "h-4 w-4",
              isFilled || isHalf ? "fill-current text-[#fbbf24]" : "fill-transparent text-[#d1d5db]",
            )}
          />
        );
      })}
    </div>
  );
}

function RelatedProductCard({ product }: { product: ProductDetailRelatedProduct }) {
  const discountPercent = getDiscountPercent(product.priceCents, product.compareAtCents);

  return (
    <Link href={product.href} className="group block">
      <div className="overflow-hidden rounded-[1.25rem] bg-[#f3f1ef]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center text-sm text-black/40">
            No image
          </div>
        )}
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-semibold tracking-tight text-black">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <RatingStars rating={product.rating} />
          {product.reviewCount > 0 && product.rating ? (
            <span className="text-sm text-black/55">{formatDisplayedRating(product.rating)}/5</span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-black">
            {formatCurrencyAmount(product.priceCents, product.currency)}
          </span>
          {product.compareAtCents ? (
            <span className="text-xl text-black/35 line-through">
              {formatCurrencyAmount(product.compareAtCents, product.currency)}
            </span>
          ) : null}
          {discountPercent ? (
            <span className="rounded-full bg-[#fef2f2] px-2.5 py-1 text-xs font-semibold text-[#ef4444]">
              -{discountPercent}%
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductDetailContent({
  product,
  onAddToCart,
}: {
  product: ProductDetailData;
  onAddToCart?: (payload: AddToCartPayload) => void | Promise<void>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    product.colorOptions[0]?.id ?? null,
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    product.sizeOptions.find((size) => size.isDefault)?.id ?? product.sizeOptions[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "faqs">("reviews");
  const [visibleReviewCount, setVisibleReviewCount] = useState(6);
  const [reviewSort, setReviewSort] = useState<"latest" | "highest" | "lowest">("latest");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ProductDetailReview | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewImageUrl, setReviewImageUrl] = useState<string | null>(null);
  const [isUploadingReviewImage, setIsUploadingReviewImage] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const selectedSize = useMemo(
    () => product.sizeOptions.find((size) => size.id === selectedSizeId) ?? null,
    [product.sizeOptions, selectedSizeId],
  );
  const selectedColor = useMemo(
    () => product.colorOptions.find((color) => color.id === selectedColorId) ?? null,
    [product.colorOptions, selectedColorId],
  );
  const currentPriceCents = selectedSize?.priceCents ?? product.priceCents;
  const currentCurrency = selectedSize?.currency ?? product.currency;
  const currentStripePriceId = selectedSize?.stripePriceId ?? product.stripePriceId;
  const compareAtCents = getCompareAtCents(currentPriceCents, product.discountPercent);
  const discountPercent = getDiscountPercent(currentPriceCents, compareAtCents);
  const selectedImageUrl = product.imageUrls[selectedImageIndex] ?? product.imageUrls[0] ?? null;
  const sortedReviews = useMemo(() => {
    const reviews = [...product.reviews];

    if (reviewSort === "highest") {
      return reviews.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    }

    if (reviewSort === "lowest") {
      return reviews.sort((a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt));
    }

    return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [product.reviews, reviewSort]);
  const visibleReviews = sortedReviews.slice(0, visibleReviewCount);

  async function handleUploadReviewImage(file: File) {
    setIsUploadingReviewImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/reviews/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload review image.");
      }

      setReviewImageUrl(data.url);
      toast({
        title: "Image uploaded",
        description: "Your review photo is ready to submit.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload review image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingReviewImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reviewRating < 1 || reviewRating > 5) {
      toast({
        title: "Rating required",
        description: "Choose a star rating before submitting your review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await fetch(`/api/shop/products/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewerName,
          reviewerEmail,
          rating: reviewRating,
          body: reviewBody,
          imageUrl: reviewImageUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      toast({
        title: "Review submitted",
        description: "Thanks for sharing your feedback.",
      });

      setIsReviewModalOpen(false);
      setReviewerName("");
      setReviewerEmail("");
      setReviewRating(0);
      setReviewBody("");
      setReviewImageUrl(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Review failed",
        description: error instanceof Error ? error.message : "Failed to submit review.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleAddToCart() {
    if (product.colorOptions.length > 0 && !selectedColorId) {
      toast({
        title: "Color required",
        description: "Choose a color before adding this item.",
        variant: "destructive",
      });
      return;
    }

    if (product.sizeOptions.length > 0 && !selectedSizeId) {
      toast({
        title: "Size required",
        description: "Choose a size before adding this item.",
        variant: "destructive",
      });
      return;
    }

    const payload: AddToCartPayload = {
      productId: product.id,
      colorId: selectedColorId,
      colorLabel: selectedColor?.label ?? null,
      sizeId: selectedSizeId,
      quantity,
      stripePriceId: currentStripePriceId,
    };

    if (onAddToCart) {
      await onAddToCart(payload);
      return;
    }

    toast({
      title: "Cart hook ready",
      description: `Prepared ${quantity} item${quantity === 1 ? "" : "s"} with stripe price ${currentStripePriceId ?? "not set"}.`,
    });
  }

  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-black/45 sm:text-sm">
          {product.breadcrumbs.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href ? (
                <Link href={item.href} className="transition hover:text-black">
                  {item.label}
                </Link>
              ) : (
                <span className="text-black/75">{item.label}</span>
              )}
              {index < product.breadcrumbs.length - 1 ? (
                <Image
                  src="/Misc/arrow.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="opacity-45"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </nav>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
          <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)]">
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 md:order-1 md:flex-col md:overflow-visible">
              {product.imageUrls.map((imageUrl, index) => (
                <button
                  key={`${product.id}-detail-thumb-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn("shrink-0 overflow-hidden transition", selectedImageIndex === index ? "opacity-100" : "opacity-60 hover:opacity-100")}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="h-24 w-24 object-cover md:h-28 md:w-28"
                  />
                </button>
              ))}
            </div>

            <div className="order-1 flex min-h-[420px] items-center justify-center md:order-2 md:min-h-[620px]">
              {selectedImageUrl ? (
                <img
                  src={selectedImageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-sm text-black/40">No image</div>
              )}
            </div>
          </div>

          <div>
            <h1 className="font-display text-[2.4rem] uppercase leading-[0.92] tracking-tight text-black sm:text-[3.15rem]">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <RatingStars rating={product.rating} />
              {product.reviewCount > 0 && product.rating ? (
                <span className="text-sm font-medium text-black/65">{formatDisplayedRating(product.rating)}/5</span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-[2.05rem] font-bold text-black">
                {formatCurrencyAmount(currentPriceCents, currentCurrency)}
              </span>
              {compareAtCents ? (
                <span className="text-[1.9rem] text-black/30 line-through">
                  {formatCurrencyAmount(compareAtCents, currentCurrency)}
                </span>
              ) : null}
              {discountPercent ? (
                <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-sm font-semibold text-[#ef4444]">
                  -{discountPercent}%
                </span>
              ) : null}
            </div>

            <p className="mt-5 max-w-2xl border-b border-black/10 pb-8 text-base leading-7 text-black/60">
              {product.shortDescription}
            </p>

            {product.colorOptions.length > 0 ? (
              <div className="border-b border-black/10 py-6">
                <p className="text-sm font-medium text-black/55">Select Colors</p>
                <div className="mt-4 flex items-center gap-3">
                  {product.colorOptions.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColorId(color.id)}
                      className={cn(
                        "relative h-10 w-10 rounded-full transition",
                        selectedColorId === color.id
                          ? "ring-2 ring-black ring-offset-2 ring-offset-white"
                          : "ring-1 ring-black/10 hover:ring-black/30",
                      )}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.label}
                    >
                      {selectedColorId === color.id ? (
                        <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-white" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-b border-black/10 py-6">
              <p className="text-sm font-medium text-black/55">Choose Size</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {product.sizeOptions.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSizeId(size.id)}
                    className={cn(
                      "rounded-full px-5 py-3 text-sm font-medium transition",
                      selectedSizeId === size.id
                        ? "bg-black text-white"
                        : "bg-[#f3f1ef] text-black/55 hover:bg-black hover:text-white",
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="inline-flex h-14 items-center justify-between rounded-full bg-[#f3f1ef] px-4 sm:min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:bg-black hover:text-white"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2ch] text-center text-base font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.min(25, current + 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:bg-black hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={() => void handleAddToCart()}
                  className="h-14 flex-1 rounded-full bg-black text-base font-semibold text-white hover:bg-black/95"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="border-b border-black/10">
            <div className="grid grid-cols-3 text-center">
              {[
                { id: "details", label: "Product Details" },
                { id: "reviews", label: "Rating & Reviews" },
                { id: "faqs", label: "FAQs" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "border-b-2 px-3 py-4 text-sm font-medium transition sm:text-lg",
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-black/45 hover:text-black",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "details" ? (
            <div className="mt-10 max-w-3xl space-y-5">
              {renderRichDescription(product.description)}
            </div>
          ) : null}

          {activeTab === "faqs" ? (
            <div className="mt-10 space-y-4">
              {product.faqs.map((faq) => (
                <div key={faq.id} className="rounded-[1rem] border border-black/10 bg-white px-5 py-4">
                  <h3 className="text-lg font-semibold text-black">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-black/60">{faq.answer}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "reviews" ? (
            <div className="mt-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[1.7rem] font-bold tracking-tight text-black">
                    All Reviews <span className="text-black/35">({product.reviewCount})</span>
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f1ef] text-black"
                        aria-label="Filter reviews"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={10}
                      collisionPadding={16}
                      className="mr-1 w-48 rounded-2xl border-black/10 p-2"
                    >
                      <DropdownMenuRadioGroup
                        value={reviewSort}
                        onValueChange={(value) => setReviewSort(value as typeof reviewSort)}
                      >
                        <DropdownMenuRadioItem value="latest">Latest</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="highest">Highest Rated</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="lowest">Lowest Rated</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    className="h-12 rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-white hover:text-black active:scale-[0.98] active:bg-white active:text-black"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Write a Review
                  </Button>
                </div>
              </div>

              {product.reviewCount === 0 ? (
                <div className="mt-8 rounded-[1.5rem] border border-dashed border-black/10 bg-[#faf8f6] px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <RatingStars rating={null} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-black">Be the first to review this product</h3>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/60">
                    Share your experience to help other shoppers decide. Tell them how the kit
                    looked, how it painted, and what stood out most.
                  </p>
                  <Button
                    className="mt-6 h-12 rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-white hover:text-black active:scale-[0.98] active:bg-white active:text-black"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Write the First Review
                  </Button>
                </div>
              ) : (
                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                  {visibleReviews.map((review) => (
                    <button
                      key={review.id}
                      type="button"
                      onClick={() => setSelectedReview(review)}
                      className="text-left rounded-[1.25rem] border border-black/10 bg-white p-6 transition hover:border-black/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <RatingStars rating={review.rating} />
                          <div className="mt-4 flex items-center gap-2">
                            <p className="text-lg font-semibold text-black">{review.name}</p>
                            {review.verified ? (
                              <CheckCircle2 className="h-4 w-4 fill-[#22c55e] text-white" />
                            ) : null}
                          </div>
                          <p className="mt-4 line-clamp-4 text-sm leading-7 text-black/60">{review.body}</p>
                          <p className="mt-5 text-sm text-black/40">Posted on {review.dateLabel}</p>
                        </div>
                        {review.imageUrl ? (
                          <div className="shrink-0 overflow-hidden rounded-2xl bg-[#f3f1ef]">
                            <img
                              src={review.imageUrl}
                              alt={`Review photo from ${review.name}`}
                              className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                              loading="lazy"
                            />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {product.reviewCount > 0 && visibleReviewCount < sortedReviews.length ? (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-black/10 px-8 text-sm font-medium"
                    onClick={() => setVisibleReviewCount(sortedReviews.length)}
                  >
                    Load More Reviews
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-20">
          <h2 className="text-center font-display text-[2.6rem] uppercase leading-none tracking-tight text-black sm:text-[3.4rem]">
            You Might Also Like
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {product.relatedProducts.map((relatedProduct) => (
              <RelatedProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      </div>

      <Dialog open={Boolean(selectedReview)} onOpenChange={(open) => (!open ? setSelectedReview(null) : undefined)}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-[1.5rem] p-5 sm:max-w-2xl sm:p-6">
          {selectedReview ? (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl uppercase tracking-tight">Review</DialogTitle>
              </DialogHeader>

              <div>
                <RatingStars rating={selectedReview.rating} />
                <div className="mt-4 flex items-center gap-2">
                  <p className="text-lg font-semibold text-black">{selectedReview.name}</p>
                  {selectedReview.verified ? (
                    <CheckCircle2 className="h-4 w-4 fill-[#22c55e] text-white" />
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-black/40">Posted on {selectedReview.dateLabel}</p>
              </div>

              {selectedReview.imageUrl ? (
                <div className="overflow-hidden rounded-2xl bg-[#f3f1ef]">
                  <img
                    src={selectedReview.imageUrl}
                    alt={`Review photo from ${selectedReview.name}`}
                    className="max-h-[420px] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <p className="text-sm leading-7 text-black/65">{selectedReview.body}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-[1.5rem] p-5 sm:max-w-xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase tracking-tight">Write a Review</DialogTitle>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmitReview}>
            <div className="space-y-2">
              <Label htmlFor="reviewer-name">Name</Label>
              <Input
                id="reviewer-name"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                placeholder="Your name"
                maxLength={80}
                disabled={isSubmittingReview}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-email">Email</Label>
              <Input
                id="reviewer-email"
                type="email"
                value={reviewerEmail}
                onChange={(event) => setReviewerEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isSubmittingReview}
              />
              <p className="text-xs text-black/45">
                If this email matches a paid order for this product, your review will show as a verified purchase.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const nextRating = index + 1;
                  const isActive = reviewRating >= nextRating;

                  return (
                    <button
                      key={nextRating}
                      type="button"
                      onClick={() => setReviewRating(nextRating)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f1ef] transition hover:bg-black hover:text-white"
                      aria-label={`Rate ${nextRating} star${nextRating === 1 ? "" : "s"}`}
                    >
                      <Star className={cn("h-5 w-5", isActive ? "fill-[#fbbf24] text-[#fbbf24]" : "text-black/25")} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="review-body">Review</Label>
                <span className="text-xs text-black/45">{reviewBody.length}/250</span>
              </div>
              <Textarea
                id="review-body"
                value={reviewBody}
                onChange={(event) => setReviewBody(event.target.value.slice(0, 250))}
                placeholder="Tell shoppers what stood out most."
                rows={5}
                maxLength={250}
                disabled={isSubmittingReview}
              />
            </div>

            <div className="space-y-3">
              <Label>Photo</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmittingReview || isUploadingReviewImage}
                >
                  {isUploadingReviewImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUploadReviewImage(file);
                    }
                  }}
                />
                {reviewImageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-black/60 hover:text-black"
                    onClick={() => setReviewImageUrl(null)}
                    disabled={isSubmittingReview || isUploadingReviewImage}
                  >
                    Remove Photo
                  </Button>
                ) : null}
              </div>

              {reviewImageUrl ? (
                <div className="overflow-hidden rounded-2xl bg-[#f3f1ef]">
                  <img
                    src={reviewImageUrl}
                    alt="Review upload preview"
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-black text-sm font-medium text-white hover:bg-black/95"
              disabled={isSubmittingReview || isUploadingReviewImage}
            >
              {isSubmittingReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
