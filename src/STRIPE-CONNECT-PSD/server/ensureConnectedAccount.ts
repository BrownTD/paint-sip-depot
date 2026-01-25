// src/STRIPE-CONNECT-PSD/server/ensureConnectedAccount.ts
import { stripe } from "./stripe";

export async function ensureConnectedAccount(existingAccountId?: string) {
  if (existingAccountId) return existingAccountId;

  const account = await stripe.accounts.create({
    type: "express",

    business_profile: {
      url: "https://www.paintsipdepot.com/",
      product_description:
        "Paint & Sip Depot is an events platform that enables independent hosts to run paint-and-sip experiences. The platform provides event pages, ticketing, optional paint kit fulfillment, and secure payment processing. Guests purchase tickets and optional kits online, and funds are paid out to hosts after Stripe verification.",
    },

    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account.id;
}