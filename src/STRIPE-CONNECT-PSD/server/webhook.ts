import Stripe from "stripe";

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      // Example: track onboarding completion
      if (account.charges_enabled && account.payouts_enabled) {
        console.log("Account fully enabled:", account.id);
        // TODO: update DB flag: onboarding_complete = true
      }

      break;
    }

    case "account.application.deauthorized": {
      const account = event.account;
      console.log("Account disconnected:", account);
      // TODO: mark account as disconnected in DB
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}