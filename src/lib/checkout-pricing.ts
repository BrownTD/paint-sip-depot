export const CHECKOUT_PROCESSING_FEE_CENTS = 135;

export function getTicketSubtotalCents(ticketPriceCents: number, quantity: number) {
  return ticketPriceCents * quantity;
}

export function getProcessingFeeCents(subtotalCents: number) {
  void subtotalCents;
  return CHECKOUT_PROCESSING_FEE_CENTS;
}

export function getCheckoutTotalCents(ticketPriceCents: number, quantity: number) {
  const subtotalCents = getTicketSubtotalCents(ticketPriceCents, quantity);
  const processingFeeCents = getProcessingFeeCents(subtotalCents);

  return {
    subtotalCents,
    processingFeeCents,
    totalCents: subtotalCents + processingFeeCents,
  };
}
