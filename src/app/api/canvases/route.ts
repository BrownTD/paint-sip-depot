import { NextResponse } from "next/server";
import { getCanvasGallerySections } from "@/lib/canvas-gallery";

export async function GET() {
  try {
    const sections = await getCanvasGallerySections();
    const canvases = sections.flatMap((section) =>
      section.items.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        tags: [item.category],
      }))
    );

    return NextResponse.json({ canvases });
  } catch (error) {
    console.error("Canvases fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch canvases" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Canvas creation is no longer supported through the API. Add files under public/canvas-options instead.",
    },
    { status: 410 }
  );
}
