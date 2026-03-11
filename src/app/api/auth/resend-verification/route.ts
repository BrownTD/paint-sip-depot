import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailVerification } from "@/lib/email-verification";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found for that email" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified" }, { status: 200 });
    }

    await sendEmailVerification({ email: user.email, name: user.name });

    return NextResponse.json({ message: "Verification email sent" }, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
