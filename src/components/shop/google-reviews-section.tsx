"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type GoogleReview = {
  id: string;
  name: string;
  rating: number;
  body: string;
  dateLabel: string;
  reviewUrl: string | null;
  imageUrl: string | null;
  createdAt: string | null;
};

type GoogleReviewsResponse = {
  placeName: string | null;
  rating: number | null;
  reviewCount: number;
  businessUrl: string | null;
  reviews: GoogleReview[];
};

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
              isFilled || isHalf ? "fill-current text-[#fbbf24]" : "fill-transparent text-[#d1d5db]"
            )}
          />
        );
      })}
    </div>
  );
}

function getReviewerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return initials || "G";
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  const content = (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f1ef] text-sm font-bold uppercase text-black/70">
        {getReviewerInitials(review.name)}
      </div>
      <div className="min-w-0 flex-1">
        <RatingStars rating={review.rating} />
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-lg font-semibold text-black">{review.name}</p>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-black/35">
            Google
          </span>
        </div>
        <p className="mt-4 line-clamp-4 text-sm leading-7 text-black/60">{review.body}</p>
        {review.dateLabel ? (
          <p className="mt-5 text-sm text-black/40">Posted {review.dateLabel}</p>
        ) : null}
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
  );

  const className =
    "block h-full rounded-[1.25rem] border border-black/10 bg-white p-6 text-left transition hover:border-black/20";

  if (review.reviewUrl) {
    return (
      <Link href={review.reviewUrl} target="_blank" rel="noreferrer" className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function GoogleReviewsSection({ className }: { className?: string }) {
  const [reviewsData, setReviewsData] = useState<GoogleReviewsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        const response = await fetch("/api/google/reviews");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as GoogleReviewsResponse;

        if (!cancelled) {
          setReviewsData(data);
        }
      } catch {
        if (!cancelled) {
          setReviewsData(null);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!reviewsData || reviewsData.reviews.length === 0) {
    return null;
  }

  return (
    <section className={cn("px-4 py-12 sm:py-16", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
              Our Happy Customers
            </h2>
            {reviewsData.rating ? (
              <div className="mt-4 flex items-center gap-3">
                <RatingStars rating={reviewsData.rating} />
                <p className="text-sm text-black/55">
                  {reviewsData.rating.toFixed(1)} from {reviewsData.reviewCount} Google reviews
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="no-scrollbar relative left-1/2 mt-8 flex w-screen -translate-x-1/2 snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:gap-5 sm:scroll-px-[max(1rem,calc((100vw-80rem)/2+1rem))] sm:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
          {reviewsData.reviews.map((review) => (
            <div
              key={review.id}
              className="w-[84vw] max-w-[420px] shrink-0 snap-start last:snap-end sm:w-[420px] lg:w-[520px] lg:max-w-[520px]"
            >
              <GoogleReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
