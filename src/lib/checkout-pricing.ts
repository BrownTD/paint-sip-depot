export const CHECKOUT_PROCESSING_FEE_CENTS = 135;

export function getEventHostShippingFeeCents() {
  const value = Number(process.env.NEXT_PUBLIC_EVENT_HOST_SHIPPING_FEE_CENTS ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

export function getTicketSubtotalCents(ticketPriceCents: number, quantity: number) {
  return ticketPriceCents * quantity;
}

export function getProcessingFeeCents(subtotalCents: number) {
  void subtotalCents;
  return CHECKOUT_PROCESSING_FEE_CENTS;
}

export function getCheckoutTotalCents(
  ticketPriceCents: number,
  quantity: number,
  options?: { includeShipping?: boolean }
) {
  const subtotalCents = getTicketSubtotalCents(ticketPriceCents, quantity);
  const processingFeeCents = getProcessingFeeCents(subtotalCents);
  const shippingFeeCents = options?.includeShipping === false ? 0 : getEventHostShippingFeeCents();

  return {
    subtotalCents,
    processingFeeCents,
    shippingFeeCents,
    totalCents: subtotalCents + processingFeeCents + shippingFeeCents,
  };
}
