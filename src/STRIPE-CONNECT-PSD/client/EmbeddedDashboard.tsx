"use client";

import React from "react";
import { ConnectProvider } from "./ConnectProvider";
import { OnboardingPanel } from "./components/OnboardingPanel";

export function EmbeddedDashboard({ onExit }: { onExit?: () => void }) {
  return (
    <ConnectProvider mode="onboarding">
      <OnboardingPanel onExit={onExit ?? (() => {})} />
    </ConnectProvider>
  );
}