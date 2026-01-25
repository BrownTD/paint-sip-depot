import { stripe } from "./stripe";

export type StripeStatus = {
  accountId: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE" | "RESTRICTED";
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  } | null;
  disabled_reason: string | null;
};

export async function getAccountStatus(accountId: string): Promise<StripeStatus> {
  const acct = await stripe.accounts.retrieve(accountId);

  const requirements = acct.requirements
    ? {
        currently_due: acct.requirements.currently_due ?? [],
        eventually_due: acct.requirements.eventually_due ?? [],
        past_due: acct.requirements.past_due ?? [],
        pending_verification: acct.requirements.pending_verification ?? [],
      }
    : null;

  const charges_enabled = !!acct.charges_enabled;
  const payouts_enabled = !!acct.payouts_enabled;
  const details_submitted = !!acct.details_submitted;

  const disabled_reason = (acct.requirements?.disabled_reason as string | null) ?? null;

  let onboarding_status: StripeStatus["onboarding_status"] = "IN_PROGRESS";

  // “NOT_STARTED” if literally nothing submitted yet and lots is due
  if (!details_submitted && (requirements?.currently_due?.length ?? 0) > 0) {
    onboarding_status = "NOT_STARTED";
  }

  // “COMPLETE” if fully enabled
  if (charges_enabled && payouts_enabled) {
    onboarding_status = "COMPLETE";
  }

  // “RESTRICTED” if Stripe is actively blocking for requirements
  if (!charges_enabled || !payouts_enabled) {
    if ((requirements?.past_due?.length ?? 0) > 0 || disabled_reason) {
      onboarding_status = "RESTRICTED";
    }
  }

  return {
    accountId,
    charges_enabled,
    payouts_enabled,
    details_submitted,
    onboarding_status,
    requirements,
    disabled_reason,
  };
}