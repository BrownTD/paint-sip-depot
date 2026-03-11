export const STRIPE_PROCESSING_PERCENT = 0.029;
export const STRIPE_PROCESSING_FIXED_CENTS = 30;

export function getTicketSubtotalCents(ticketPriceCents: number, quantity: number) {
  return ticketPriceCents * quantity;
}

export function getProcessingFeeCents(subtotalCents: number) {
  return Math.round(subtotalCents * STRIPE_PROCESSING_PERCENT) + STRIPE_PROCESSING_FIXED_CENTS;
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
