// src/app/(dashboard)/dashboard/StripeGate.tsx

"use client";

import * as React from "react";
import { EmbeddedDashboard } from "@/STRIPE-CONNECT-PSD/client/EmbeddedDashboard";
import { StripeOnboardingCard } from "@/components/stripe/StripeOnboardingCard";
import { EmbeddedOnboarding } from "@/STRIPE-CONNECT-PSD/client/EmbeddedOnboarding";

type StripeStatusResponse = {
  accountId: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE" | "RESTRICTED";
  requirements: null | {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  disabled_reason: string | null;
};

const POLL_MS = 2500;

export function StripeGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<StripeStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fullyEnabled =
    !!status?.accountId && status.charges_enabled && status.payouts_enabled;

  async function refresh(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;

    try {
      if (!silent) setLoading(true);
      setError(null);

      const res = await fetch("/api/account-status", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as StripeStatusResponse;
      setStatus(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load Stripe status");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!fullyEnabled) {
      pollingRef.current = setInterval(() => {
        refresh({ silent: true });
      }, POLL_MS);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullyEnabled]);

  React.useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") {
        refresh({ silent: true });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !status) return <div className="p-6">Loading your dashboard…</div>;
  if (fullyEnabled) return <>{children}</>;

  return (
    <div className="p-6 space-y-6">
      {error ? (
        <div className="text-sm text-red-600">
          {error}{" "}
          <button className="underline" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Checking Stripe status automatically…</p>
      )}

      {/* Your nicer UI */}
      <StripeOnboardingCard
        onStart={() => {
          // Stripe’s embedded UI has the actual “Add information” button.
          // This just scrolls to it so your CTA feels real.
          document.getElementById("stripe-embedded")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Stripe embedded UI */}
      <div id="stripe-embedded" className="rounded-2xl border bg-background p-4">
        <EmbeddedDashboard />
      </div>
    </div>
  );
}