import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const canvasSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    const canvases = await prisma.canvas.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ canvases });
  } catch (error) {
    console.error("Canvases fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch canvases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = canvasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const canvas = await prisma.canvas.create({
      data: {
        name: parsed.data.name,
        imageUrl: parsed.data.imageUrl,
        tags: parsed.data.tags,
      },
    });

    return NextResponse.json({ canvas }, { status: 201 });
  } catch (error) {
    console.error("Canvas creation error:", error);
    return NextResponse.json({ error: "Failed to create canvas" }, { status: 500 });
  }
}