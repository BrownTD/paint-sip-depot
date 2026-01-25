"use client";
import { ConnectPayments } from "@stripe/react-connect-js";

export function PaymentsPanel() {
  return <ConnectPayments />;
}