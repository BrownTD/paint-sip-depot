import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountStatus } from "@/STRIPE-CONNECT-PSD/server/getAccountStatus";
import type { StripeOnboardingStatus } from "@prisma/client";
import { Prisma } from "@prisma/client"; // ✅ add this

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeAccountId: true,
        stripeOnboardingStatus: true,
        stripeLastSyncedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeAccountId) {
      return NextResponse.json({
        accountId: null,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        onboarding_status: user.stripeOnboardingStatus,
        requirements: null,
        disabled_reason: null,
        last_synced_at: user.stripeLastSyncedAt,
      });
    }

    const status = await getAccountStatus(user.stripeAccountId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeDetailsSubmitted: status.details_submitted,
        stripeChargesEnabled: status.charges_enabled,
        stripePayoutsEnabled: status.payouts_enabled,

        // ✅ key fix
        stripeRequirements: status.requirements
          ? (status.requirements as Prisma.InputJsonValue)
          : Prisma.DbNull,

        stripeDisabledReason: status.disabled_reason ?? null,
        stripeOnboardingStatus: status.onboarding_status as StripeOnboardingStatus,
        stripeLastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...status,
      last_synced_at: new Date(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}