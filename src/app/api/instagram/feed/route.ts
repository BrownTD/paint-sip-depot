import { NextResponse } from "next/server";

export const revalidate = 900;

const mockInstagramPosts = [
  {
    id: "mock-1",
    mediaType: "IMAGE",
    thumbnailUrl: "/canvas-options/Paint & Praise/windsOfRevival.jpeg",
    caption: "Fresh paint kit setup for a faith-filled paint and sip night.",
    permalink: "https://www.instagram.com/",
    publishedAt: "2026-04-18T14:00:00.000Z",
    likeCount: 128,
  },
  {
    id: "mock-2",
    mediaType: "IMAGE",
    thumbnailUrl: "/canvas-options/Paint & Praise/bloomingFaith.PNG",
    caption: "Blooming Faith is ready for your next creative gathering.",
    permalink: "https://www.instagram.com/",
    publishedAt: "2026-04-16T16:30:00.000Z",
    likeCount: 94,
  },
  {
    id: "mock-3",
    mediaType: "VIDEO",
    thumbnailUrl: "/Misc/supllies.png",
    caption: "Behind the scenes: packing paint kits and supplies.",
    permalink: "https://www.instagram.com/",
    publishedAt: "2026-04-13T18:15:00.000Z",
    likeCount: 211,
  },
  {
    id: "mock-4",
    mediaType: "IMAGE",
    thumbnailUrl: "/canvas-options/Paint & Praise/armorOfGod.PNG",
    caption: "A bold canvas option for hosts planning something meaningful.",
    permalink: "https://www.instagram.com/",
    publishedAt: "2026-04-11T13:45:00.000Z",
    likeCount: 157,
  },
  {
    id: "mock-5",
    mediaType: "IMAGE",
    thumbnailUrl: "/canvas-options/Paint & Praise/prayerWorks.PNG",
    caption: "Prayer Works is one of our favorite group-friendly kits.",
    permalink: "https://www.instagram.com/",
    publishedAt: "2026-04-09T15:20:00.000Z",
    likeCount: 176,
  },
  {
    id: "mock-6",
    mediaType: "IMAGE",
    thumbnailUrl: "/Misc/backgroundmobile.png",
    caption: "Color, creativity, and everything needed for a smooth event.",
    permalink: "https://www.instagram.com/",
    publishedAt: "2026-04-05T17:05:00.000Z",
    likeCount: 143,
  },
];

export async function GET() {
  // TODO: Replace mock data with Instagram Graph API media fetch once Meta credentials are available.
  // Keep the access token server-side and cache the response here so page loads do not call Meta directly.
  return NextResponse.json(
    {
      source: "mock",
      posts: mockInstagramPosts,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    },
  );
}
