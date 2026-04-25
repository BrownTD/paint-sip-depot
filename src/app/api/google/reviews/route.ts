import { NextResponse } from "next/server";

export const revalidate = 3600;

type GooglePlaceReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: {
    text?: string;
    languageCode?: string;
  };
  originalText?: {
    text?: string;
    languageCode?: string;
  };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  photos?: Array<{
    photoUri?: string;
  }>;
  publishTime?: string;
};

type GooglePlaceResponse = {
  id?: string;
  displayName?: {
    text?: string;
  };
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: GooglePlaceReview[];
};

function formatDateLabel(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json(
      { error: "Google Places reviews are not configured.", reviews: [] },
      { status: 503 }
    );
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("fields", "id,displayName,googleMapsUri,rating,userRatingCount,reviews");

  try {
    const response = await fetch(url, {
      headers: {
        "X-Goog-FieldMask": "id,displayName,googleMapsUri,rating,userRatingCount,reviews",
      },
      next: { revalidate },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("Google Places reviews fetch failed:", response.status, errorBody);
      return NextResponse.json(
        { error: "Google reviews could not be loaded.", reviews: [] },
        { status: 502 }
      );
    }

    const place = (await response.json()) as GooglePlaceResponse;
    const businessUrl =
      place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(place.id || placeId)}`;
    const reviews = (place.reviews || [])
      .map((review) => {
        const body = review.text?.text || review.originalText?.text || "";
        const name = review.authorAttribution?.displayName || "Google reviewer";

        return {
          id: review.name || `${name}-${review.publishTime || body.slice(0, 24)}`,
          name,
          rating: review.rating || 0,
          body,
          dateLabel:
            review.relativePublishTimeDescription || formatDateLabel(review.publishTime) || "",
          reviewUrl: businessUrl,
          imageUrl: review.photos?.[0]?.photoUri || null,
          createdAt: review.publishTime || null,
        };
      })
      .filter((review) => review.body && review.rating > 0);

    return NextResponse.json(
      {
        placeName: place.displayName?.text || null,
        rating: place.rating || null,
        reviewCount: place.userRatingCount || reviews.length,
        businessUrl,
        reviews,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Google Places reviews error:", error);
    return NextResponse.json(
      { error: "Google reviews could not be loaded.", reviews: [] },
      { status: 500 }
    );
  }
}
