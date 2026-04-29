import { NextResponse } from "next/server";

import { sendNewsletterWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { newsletterOptInSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = newsletterOptInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const existingOptIn = await prisma.newsLetterOptIn.findUnique({
      where: { email },
    });

    if (existingOptIn) {
      return NextResponse.json(
        { message: "This email is already subscribed." },
        { status: 200 }
      );
    }

    await prisma.newsLetterOptIn.create({
      data: { email },
    });

    await sendNewsletterWelcomeEmail({ to: email });

    return NextResponse.json(
      { message: "You are subscribed to the newsletter." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}
