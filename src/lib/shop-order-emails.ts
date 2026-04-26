import {
  sendAdminShopOrderConfirmationEmail,
  sendCustomerShopOrderConfirmationEmail,
  sendCustomerShopDeliveredEmail,
  sendCustomerShopProcessingEmail,
  sendCustomerShopTrackingEmail,
} from "@/lib/email";
import { getAbsoluteUrl } from "@/lib/utils";

type ShopOrderForEmail = {
  id: string;
  customerName: string;
  customerEmail: string;
  amountSubtotalCents: number;
  amountTotalCents: number;
  shippingAmountCents: number;
  shippingProvider: string | null;
  shippingService: string | null;
  trackingNumber: string | null;
  trackingStatus: string | null;
  trackingUrl: string | null;
  currency: string;
  stripeCheckoutSessionId: string | null;
  items: Array<{
    productNameSnapshot: string;
    variantLabelSnapshot: string;
    colorLabelSnapshot: string | null;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
  }>;
};

export async function sendShopOrderConfirmationEmails(order: ShopOrderForEmail) {
  const payload = buildShopOrderEmailPayload(order);

  const results = await Promise.allSettled([
    sendAdminShopOrderConfirmationEmail(payload),
    sendCustomerShopOrderConfirmationEmail(payload),
  ]);
  const rejected = results.filter((result) => result.status === "rejected");
  if (rejected.length > 0) {
    console.error("Shop order confirmation email failed:", {
      shopOrderId: order.id,
      errors: rejected,
    });
  }
}

export async function sendShopOrderTrackingEmail(order: ShopOrderForEmail) {
  await sendCustomerShopTrackingEmail(buildShopOrderEmailPayload(order));
}

export async function sendShopOrderProcessingEmail(order: ShopOrderForEmail) {
  await sendCustomerShopProcessingEmail(buildShopOrderEmailPayload(order));
}

export async function sendShopOrderDeliveredEmail(order: ShopOrderForEmail) {
  await sendCustomerShopDeliveredEmail(buildShopOrderEmailPayload(order));
}

function buildShopOrderEmailPayload(order: ShopOrderForEmail) {
  const orderUrl = order.stripeCheckoutSessionId
    ? getAbsoluteUrl(`/shop/success?session_id=${encodeURIComponent(order.stripeCheckoutSessionId)}`)
    : getAbsoluteUrl("/shop");

  return {
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    amountSubtotalCents: order.amountSubtotalCents,
    amountTotalCents: order.amountTotalCents,
    shippingAmountCents: order.shippingAmountCents,
    shippingProvider: order.shippingProvider,
    shippingService: order.shippingService,
    trackingNumber: order.trackingNumber,
    trackingStatus: order.trackingStatus,
    trackingUrl: order.trackingUrl,
    currency: order.currency,
    orderUrl,
    items: order.items.map((item) => ({
      productName: item.productNameSnapshot,
      variantLabel: item.variantLabelSnapshot,
      colorLabel: item.colorLabelSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
    })),
  };
}
