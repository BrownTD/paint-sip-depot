export function formatCurrencyAmount(amountCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function formatAmountForDisplay(amountCents: number): string {
  return formatCurrencyAmount(amountCents, "USD");
}
