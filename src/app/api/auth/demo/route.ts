import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@paintsip.com";
const DEMO_PASSWORD = "demo123";
const DEMO_NAME = "Demo Host";

export async function POST() {
  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        name: DEMO_NAME,
        passwordHash,
        role: "HOST",
      },
      create: {
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        passwordHash,
        role: "HOST",
      },
    });

    return NextResponse.json(
      {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Demo account bootstrap error:", error);
    return NextResponse.json(
      { error: "Failed to prepare demo account" },
      { status: 500 }
    );
  }
}
