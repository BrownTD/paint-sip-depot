import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const override = body.bookingCutoffOverrideAt;

    if (override !== null && typeof override !== "string") {
      return NextResponse.json({ error: "Invalid cutoff override" }, { status: 400 });
    }

    if (typeof override === "string" && Number.isNaN(new Date(override).getTime())) {
      return NextResponse.json({ error: "Invalid cutoff override" }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        bookingCutoffOverrideAt: override ? new Date(override) : null,
      },
      select: {
        id: true,
        bookingCutoffOverrideAt: true,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Admin cutoff override error:", error);
    return NextResponse.json({ error: "Failed to update booking cutoff" }, { status: 500 });
  }
}
