import {
  sendAdminShopOrderConfirmationEmail,
  sendCustomerShopOrderConfirmationEmail,
} from "@/lib/email";
import { getAbsoluteUrl } from "@/lib/utils";

type ShopOrderForEmail = {
  id: string;
  customerName: string;
  customerEmail: string;
  amountSubtotalCents: number;
  amountTotalCents: number;
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
  const orderUrl = order.stripeCheckoutSessionId
    ? getAbsoluteUrl(`/shop/success?session_id=${encodeURIComponent(order.stripeCheckoutSessionId)}`)
    : getAbsoluteUrl("/shop");
  const payload = {
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    amountSubtotalCents: order.amountSubtotalCents,
    amountTotalCents: order.amountTotalCents,
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
