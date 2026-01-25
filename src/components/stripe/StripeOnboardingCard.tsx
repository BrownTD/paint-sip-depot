import { CreditCard, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StripeOnboardingCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-xl mx-auto rounded-2xl border bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Finish setting up payouts</h2>
          <p className="text-sm text-muted-foreground">
            Complete Stripe onboarding so we can pay you out.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-900">
        ⚠️ Payouts are not enabled yet
      </div>

      <ul className="space-y-3 mb-8 text-sm">
        <li className="flex items-center gap-2 text-green-600">
          ✓ Platform details added
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          ⏳ Identity verification
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          ⏳ Bank account for payouts
        </li>
      </ul>

      <Button onClick={onStart} className="w-full gap-2">
        Complete payout setup
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        Secure payments powered by Stripe
      </div>
    </div>
  );
}