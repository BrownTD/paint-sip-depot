import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: { emailVerified: true, passwordHash: true },
    });

    return NextResponse.json({
      needsVerification: Boolean(user?.passwordHash && !user.emailVerified),
    });
  } catch (error) {
    console.error("Verification status error:", error);
    return NextResponse.json({ error: "Failed to check verification status" }, { status: 500 });
  }
}
