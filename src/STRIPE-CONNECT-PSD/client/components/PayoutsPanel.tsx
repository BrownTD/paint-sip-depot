"use client";
import { ConnectPayouts, ConnectBalances } from "@stripe/react-connect-js";

export function PayoutsPanel() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ConnectBalances />
      <ConnectPayouts />
    </div>
  );
}