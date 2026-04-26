import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  buildShippoShopAddress,
  getShippoUspsRateQuote,
  purchaseShippoLabelsFromRates,
} from "@/lib/shippo";
import { sendShopOrderProcessingEmail } from "@/lib/shop-order-emails";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { error } = await requireAdminApiSession();
  if (error) return error;

  const { orderId } = await context.params;
  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Shop order not found." }, { status: 404 });
  }

  if (order.status !== ShopOrderStatus.PAID && order.status !== ShopOrderStatus.FULFILLED) {
    return NextResponse.json({ error: "Only paid shop orders can have labels purchased." }, { status: 409 });
  }

  if (order.shippoTransactionId && order.labelUrl) {
    return NextResponse.json({ order });
  }

  if (
    !order.shippingName ||
    !order.shippingAddress ||
    !order.shippingCity ||
    !order.shippingState ||
    !order.shippingZip
  ) {
    return NextResponse.json({ error: "This order is missing the shipping address needed for Shippo." }, { status: 409 });
  }

  try {
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const refreshedQuote = await getShippoUspsRateQuote({
      toAddress: buildShippoShopAddress({
        shippingName: order.shippingName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingZip: order.shippingZip,
        shippingPhone: order.shippingPhone,
        customerEmail: order.customerEmail,
      }),
      quantity: totalQuantity,
      metadata: `Shop ${order.id}`,
    });

    const label = await purchaseShippoLabelsFromRates({
      rateIds: refreshedQuote.rateId.split(","),
      metadata: `Shop order ${order.id}`,
    });

    const updatedOrder = await prisma.shopOrder.update({
      where: { id: order.id },
      data: {
        shippoShipmentId: refreshedQuote.shipmentId,
        shippoRateId: refreshedQuote.rateId,
        shippingProvider: refreshedQuote.provider,
        shippingService: refreshedQuote.service,
        shippingEstimatedDays: refreshedQuote.estimatedDays,
        shippingArrivesBy: refreshedQuote.arrivesBy,
        shippingEstimateLabel: refreshedQuote.estimateLabel,
        ...label,
        shippoOrderStatus: "SHIPPED",
      },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    await sendShopOrderProcessingEmail(updatedOrder).catch((emailError: unknown) => {
      console.error("Shop order processing email failed:", {
        shopOrderId: updatedOrder.id,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (labelError) {
    console.error("Admin Shippo label purchase failed:", {
      shopOrderId: order.id,
      error: labelError instanceof Error ? labelError.message : String(labelError),
    });

    return NextResponse.json(
      { error: labelError instanceof Error ? labelError.message : "Shippo label purchase failed." },
      { status: 500 },
    );
  }
}
