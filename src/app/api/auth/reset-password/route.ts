import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { normalizeEmail } from "@/lib/utils";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid password reset request" },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken({
      email: normalizeEmail(parsed.data.email),
      token: parsed.data.token,
      password: parsed.data.password,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "expired"
              ? "This password reset link has expired. Request a new one."
              : "This password reset link is invalid.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Password updated" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
