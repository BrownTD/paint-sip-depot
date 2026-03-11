import { NextRequest, NextResponse } from "next/server";
import { findEventByCode, isLiveEvent, normalizeEventCode } from "@/lib/event-discovery";

export async function GET(request: NextRequest) {
  const code = normalizeEventCode(request.nextUrl.searchParams.get("code") || "");

  if (!code) {
    return NextResponse.json({ error: "Event code is required" }, { status: 400 });
  }

  const event = await findEventByCode(code);

  if (!event || !isLiveEvent(event.startDateTime, event.status)) {
    return NextResponse.json(
      { error: "We couldn't find an event with that code" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    slug: event.slug,
    visibility: event.visibility,
    eventCode: event.eventCode,
  });
}
