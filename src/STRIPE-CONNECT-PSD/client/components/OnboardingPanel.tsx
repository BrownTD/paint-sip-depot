"use client";

import { ConnectAccountOnboarding } from "@stripe/react-connect-js";

type OnboardingPanelProps = {
  onExit: () => void | Promise<void>;
};

export function OnboardingPanel({ onExit }: OnboardingPanelProps) {
  return (
    <ConnectAccountOnboarding
      onExit={() => {
        void onExit();
      }}
    />
  );
}