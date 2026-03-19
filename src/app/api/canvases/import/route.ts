import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canvasImportSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = canvasImportSchema.safeParse(body.canvases);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid canvas data format" },
        { status: 400 }
      );
    }

    let importedCount = 0;
    for (const canvas of parsed.data) {
      try {
        await prisma.canvas.upsert({
          where: { id: canvas.name.toLowerCase().replace(/\s+/g, "-") },
          update: { name: canvas.name, imageUrl: canvas.imageUrl, tags: canvas.tags },
          create: {
            id: canvas.name.toLowerCase().replace(/\s+/g, "-"),
            name: canvas.name,
            imageUrl: canvas.imageUrl,
            tags: canvas.tags,
          },
        });
        importedCount++;
      } catch {
        console.log(`Skipped duplicate canvas: ${canvas.name}`);
      }
    }

    return NextResponse.json({ count: importedCount }, { status: 201 });
  } catch (error) {
    console.error("Canvas import error:", error);
    return NextResponse.json({ error: "Failed to import canvases" }, { status: 500 });
  }
}