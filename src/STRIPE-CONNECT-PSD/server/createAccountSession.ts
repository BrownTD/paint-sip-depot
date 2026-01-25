import Stripe from "stripe";
import { stripe } from "./stripe";

export const ALLOWED_MODES = ["onboarding", "compliance", "payments", "payouts"] as const;
export type SessionMode = (typeof ALLOWED_MODES)[number];

export async function createAccountSession(params: {
  accountId: string;
  mode: SessionMode;
}) {
  const { accountId, mode } = params;

  const components: Stripe.AccountSessionCreateParams.Components = {};

  if (mode === "onboarding") {
    components.account_onboarding = {
      enabled: true,
    };
  }

  if (mode === "compliance") {
    components.notification_banner = { enabled: true };
    components.account_management = { enabled: true };
  }

  if (mode === "payments") {
    components.payments = {
      enabled: true,
      features: {
        refund_management: true,
        dispute_management: true,
        capture_payments: true,
      },
    };
  }

  if (mode === "payouts") {
    components.balances = { enabled: true };
    components.payouts = { enabled: true };
  }

  const session = await stripe.accountSessions.create({
    account: accountId,
    components,
  });

  return session.client_secret;
}