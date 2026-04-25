"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Heart, Instagram, Play } from "lucide-react";

type InstagramPost = {
  id: string;
  mediaType: string;
  thumbnailUrl: string;
  caption?: string;
  permalink: string;
  publishedAt?: string;
  likeCount?: number;
};

type InstagramFeedResponse = {
  source: "mock" | "instagram";
  posts: InstagramPost[];
};

function InstagramFeedSkeleton() {
  return (
    <div className="no-scrollbar relative left-1/2 flex w-screen -translate-x-1/2 snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-[max(1rem,calc((100vw-80rem)/2+1rem))] sm:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square w-[78vw] max-w-[320px] shrink-0 snap-start animate-pulse rounded-[1.5rem] bg-black/10 last:snap-end sm:w-[300px] lg:w-[340px]"
        />
      ))}
    </div>
  );
}

function formatPostDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLikeCount(value?: number) {
  if (value == null) {
    return null;
  }

  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const response = await fetch("/api/instagram/feed");

        if (!response.ok) {
          throw new Error("Unable to load Instagram posts.");
        }

        const data = (await response.json()) as InstagramFeedResponse;

        if (!cancelled) {
          setPosts(data.posts.slice(0, 6));
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Instagram posts could not be loaded right now.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-4 pb-14 pt-2 sm:pb-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
              <Instagram className="h-4 w-4" />
              Instagram
            </div>
            <h2 className="font-display text-4xl uppercase tracking-tight text-black sm:text-5xl">
              Follow Us on Instagram
            </h2>
          </div>

          <Link
            href="https://www.instagram.com/paintsipdepot/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-black transition hover:text-black/65"
          >
            View Profile
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? <InstagramFeedSkeleton /> : null}

          {!isLoading && error ? (
            <div className="rounded-[1.5rem] border border-black/10 bg-[#f8f7f5] p-8 text-sm text-black/65">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && posts.length === 0 ? (
            <div className="rounded-[1.5rem] border border-black/10 bg-[#f8f7f5] p-8 text-sm text-black/65">
              No Instagram posts are available yet.
            </div>
          ) : null}

          {!isLoading && !error && posts.length > 0 ? (
            <div className="no-scrollbar relative left-1/2 flex w-screen -translate-x-1/2 snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-[max(1rem,calc((100vw-80rem)/2+1rem))] sm:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="group w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.08)] last:snap-end sm:w-[300px] lg:w-[340px]"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#f8f7f5]">
                    <Image
                      src={post.thumbnailUrl}
                      alt={post.caption || "Instagram post"}
                      fill
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 300px, 340px"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {post.mediaType === "VIDEO" ? (
                      <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    ) : null}
                    {post.publishedAt || post.likeCount != null ? (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-full bg-white/92 px-3 py-2 text-xs font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur">
                        <span>{formatPostDate(post.publishedAt)}</span>
                        {formatLikeCount(post.likeCount) ? (
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 fill-current" />
                            {formatLikeCount(post.likeCount)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {post.caption ? (
                    <p className="line-clamp-2 min-h-[3.25rem] px-4 py-4 text-sm leading-6 text-black/65">
                      {post.caption}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
