import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureConnectedAccount } from "@/STRIPE-CONNECT-PSD/server/ensureConnectedAccount";
import { createAccountSession, type SessionMode, ALLOWED_MODES } from "@/STRIPE-CONNECT-PSD/server/createAccountSession";

function parseMode(input: unknown): SessionMode {
  if (typeof input !== "string") return "onboarding";
  return (ALLOWED_MODES as readonly string[]).includes(input) ? (input as SessionMode) : "onboarding";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const mode = parseMode((body as any).mode);

    const existingAccountId = (user as any).stripeAccountId as string | null;

    const accountId = await ensureConnectedAccount(existingAccountId ?? undefined);

    if (!existingAccountId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: accountId } as any,
      });
    }

    const clientSecret = await createAccountSession({ accountId, mode });

    return NextResponse.json({ client_secret: clientSecret });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}