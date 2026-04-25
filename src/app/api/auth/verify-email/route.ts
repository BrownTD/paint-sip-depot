import { NextResponse } from "next/server";
import { verifyEmailCode } from "@/lib/email-verification";
import { normalizeEmail } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const code = typeof body.code === "string" ? body.code : "";

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const result = await verifyEmailCode(email, code);

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "expired"
              ? "That verification code has expired. Request a new code."
              : "That verification code is invalid.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Email verified" }, { status: 200 });
  } catch (error) {
    console.error("Verify email code error:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
