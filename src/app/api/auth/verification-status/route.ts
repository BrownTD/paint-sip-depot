import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
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
