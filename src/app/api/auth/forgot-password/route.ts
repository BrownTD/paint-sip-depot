import { NextResponse } from "next/server";
import { sendPasswordResetLink } from "@/lib/password-reset";
import { normalizeEmail } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await sendPasswordResetLink(email);

    return NextResponse.json(
      { message: "If an account exists for that email, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to request password reset" }, { status: 500 });
  }
}
