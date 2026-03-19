import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Canvas CSV import is no longer supported. Add files under public/canvas-options to update the canvas catalog.",
    },
    { status: 410 }
  );
}
