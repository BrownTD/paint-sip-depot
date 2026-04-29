import { ShopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminShippingOrder = Awaited<ReturnType<typeof getAdminShippingOrders>>[number];

function serializeShopOrder(order: Awaited<ReturnType<typeof getRawShopOrders>>[number]) {
  return {
    source: "shop" as const,
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

function serializeEventShippingOrder(order: Awaited<ReturnType<typeof getRawEventShippingOrders>>[number]) {
  const eventItem = {
    id: `${order.id}-event-kits`,
    productNameSnapshot: `${order.event.title} event kits`,
    variantLabelSnapshot: "Event kits",
    colorLabelSnapshot: null,
    quantity: order.totalKits,
    unitPriceCents: 0,
    totalPriceCents: 0,
    currency: order.currency,
  };

  return {
    source: "event" as const,
    id: order.id,
    customerName: order.hostName || "Event host",
    customerEmail: order.hostEmail || "",
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingZip: order.shippingZip,
    shippingPhone: null,
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
    stripeCheckoutSessionId: null,
    amountSubtotalCents: 0,
    amountTotalCents: order.shippingAmountCents,
    createdAt: order.createdAt.toISOString(),
    eventTitle: order.event.title,
    eventId: order.eventId,
    totalKits: order.totalKits,
    paidBookingCount: order.paidBookingCount,
    items: [eventItem],
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

async function getRawEventShippingOrders() {
  return prisma.eventShippingOrder.findMany({
    where: {
      status: {
        in: [ShopOrderStatus.PAID, ShopOrderStatus.FULFILLED],
      },
    },
    include: {
      event: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminShippingOrders() {
  const [shopOrders, eventOrders] = await Promise.all([getRawShopOrders(), getRawEventShippingOrders()]);
  return [...shopOrders.map(serializeShopOrder), ...eventOrders.map(serializeEventShippingOrder)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
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

  if (order) return serializeShopOrder(order);

  const eventOrder = await prisma.eventShippingOrder.findUnique({
    where: { id: orderId },
    include: {
      event: {
        select: {
          title: true,
        },
      },
    },
  });

  return eventOrder ? serializeEventShippingOrder(eventOrder) : null;
}
