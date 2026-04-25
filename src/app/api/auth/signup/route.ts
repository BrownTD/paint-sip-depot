import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";
import { normalizeEmail } from "@/lib/utils";
import { sendEmailVerification } from "@/lib/email-verification";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, password, recaptchaToken } = parsed.data;
    const email = normalizeEmail(parsed.data.email);
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken);

    if (!recaptchaResult.ok) {
      return NextResponse.json(
        { error: recaptchaResult.error },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // bcrypt (recommended for production)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "HOST", emailVerified: null },
    });

    await sendEmailVerification({ email: user.email, name: user.name });

    return NextResponse.json(
      { message: "Account created successfully. Check your email for your verification code.", userId: user.id, email },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
