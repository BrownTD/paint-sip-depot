"use client";

import React from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { ConnectComponentsProvider } from "@stripe/react-connect-js";

type SessionMode = "onboarding" | "compliance" | "payments" | "payouts";

export function ConnectProvider({
  mode,
  children,
}: {
  mode: SessionMode;
  children: React.ReactNode;
}) {
  const connectInstance = React.useMemo(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing");

    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => {
        const res = await fetch("/api/account-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to create account session: ${text}`);
        }

        const data = (await res.json()) as { client_secret: string };
        return data.client_secret;
      },

      // ✅ Stripe embedded UI theme config
      appearance: {
        variables: {
          colorPrimary: "#6741ff",
          colorText: "#1f1f1f",
          buttonSecondaryColorBackground: "#F4F2FF",
          buttonSecondaryColorBorder: "#D6CCFF",
          buttonSecondaryColorText: "#6741ff",
          colorSecondaryText: "#6B7280",
          actionSecondaryColorText: "#4B2FD6",
          colorBorder: "#E5E7EB",
          formAccentColor: "#CDF202",
          badgeNeutralColorBackground: "#F3F4F6",
          badgeNeutralColorBorder: "#E5E7EB",
          badgeNeutralColorText: "#374151",
          badgeSuccessColorBackground: "#ECFCCB",
          badgeSuccessColorBorder: "#CDF202",
          badgeSuccessColorText: "#365314",
          badgeWarningColorBackground: "#FEF3C7",
          badgeWarningColorBorder: "#FACC15",
          badgeWarningColorText: "#92400E",
          badgeDangerColorBackground: "#FEE2E2",
          badgeDangerColorBorder: "#FCA5A5",
          badgeDangerColorText: "#7F1D1D",
          offsetBackgroundColor: "#FAFAFF",
          borderRadius: "10px",
          spacingUnit: "10px",
          fontFamily: "-apple-system, Blink",
        },
      },
    });
  }, [mode]);

  return (
    <ConnectComponentsProvider connectInstance={connectInstance}>
      {children}
    </ConnectComponentsProvider>
  );
}