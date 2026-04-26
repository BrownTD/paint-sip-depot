import { ShopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminShippingOrder = Awaited<ReturnType<typeof getAdminShippingOrders>>[number];

function serializeShopOrder(order: Awaited<ReturnType<typeof getRawShopOrders>>[number]) {
  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingZip: order.shippingZip,
    shippingPhone: order.shippingPhone,
    shippingAmountCents: order.shippingAmountCents,
    shippingProvider: order.shippingProvider,
    shippingService: order.shippingService,
    shippingEstimatedDays: order.shippingEstimatedDays,
    shippingArrivesBy: order.shippingArrivesBy,
    shippingEstimateLabel: order.shippingEstimateLabel,
    shippoShipmentId: order.shippoShipmentId,
    shippoRateId: order.shippoRateId,
    shippoOrderId: order.shippoOrderId,
    shippoOrderStatus: order.shippoOrderStatus,
    shippoTransactionId: order.shippoTransactionId,
    trackingCarrier: order.trackingCarrier,
    trackingNumber: order.trackingNumber,
    trackingStatus: order.trackingStatus,
    trackingStatusDetails: order.trackingStatusDetails,
    trackingUrl: order.trackingUrl,
    labelUrl: order.labelUrl,
    qrCodeUrl: order.qrCodeUrl,
    packingSlipUrl: order.packingSlipUrl,
    currency: order.currency,
    status: order.status,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    amountSubtotalCents: order.amountSubtotalCents,
    amountTotalCents: order.amountTotalCents,
    createdAt: order.createdAt.toISOString(),
    items: order.items,
  };
}

async function getRawShopOrders() {
  return prisma.shopOrder.findMany({
    where: {
      status: {
        in: [ShopOrderStatus.PAID, ShopOrderStatus.FULFILLED],
      },
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productNameSnapshot: true,
          variantLabelSnapshot: true,
          colorLabelSnapshot: true,
          quantity: true,
          unitPriceCents: true,
          totalPriceCents: true,
          currency: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminShippingOrders() {
  const orders = await getRawShopOrders();
  return orders.map(serializeShopOrder);
}

export async function getAdminShippingOrder(orderId: string) {
  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productNameSnapshot: true,
          variantLabelSnapshot: true,
          colorLabelSnapshot: true,
          quantity: true,
          unitPriceCents: true,
          totalPriceCents: true,
          currency: true,
        },
      },
    },
  });

  return order ? serializeShopOrder(order) : null;
}
