"use client";

import React from "react";
import { ConnectProvider } from "./ConnectProvider";
import { OnboardingPanel } from "./components/OnboardingPanel";

export function EmbeddedOnboarding({ onDone }: { onDone?: () => void }) {
  return (
    <ConnectProvider mode="onboarding">
      <OnboardingPanel onExit={onDone ?? (() => {})} />
    </ConnectProvider>
  );
}