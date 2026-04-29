import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin";
import { sendHostEventShippingTrackingEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  buildShippoEventHostAddress,
  getShippoUspsRateQuote,
  purchaseShippoLabelsFromRates,
} from "@/lib/shippo";
import { getAbsoluteUrl } from "@/lib/utils";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { error } = await requireAdminApiSession();
  if (error) return error;

  const { orderId } = await context.params;
  const order = await prisma.eventShippingOrder.findUnique({
    where: { id: orderId },
    include: { event: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Event shipping order not found." }, { status: 404 });
  }

  if (order.status !== ShopOrderStatus.PAID && order.status !== ShopOrderStatus.FULFILLED) {
    return NextResponse.json({ error: "Only paid event shipping orders can have labels purchased." }, { status: 409 });
  }

  if (order.shippoTransactionId && order.labelUrl) {
    return NextResponse.json({ order });
  }

  try {
    const refreshedQuote = await getShippoUspsRateQuote({
      toAddress: buildShippoEventHostAddress({
        shippingRecipientName: order.shippingName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingZip: order.shippingZip,
        hostEmail: order.hostEmail,
      }),
      quantity: order.totalKits,
      metadata: `Event shipping ${order.eventId}`,
    });
    const label = await purchaseShippoLabelsFromRates({
      rateIds: refreshedQuote.rateId.split(","),
      metadata: `Event shipping order ${order.id}`,
    });

    const updatedOrder = await prisma.eventShippingOrder.update({
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
      include: { event: true },
    });

    if (updatedOrder.hostEmail) {
      await sendHostEventShippingTrackingEmail({
        to: updatedOrder.hostEmail,
        recipientName: updatedOrder.hostName,
        eventTitle: updatedOrder.event.title,
        eventUrl: getAbsoluteUrl(`/e/${updatedOrder.event.slug}`),
        startDateTime: updatedOrder.event.startDateTime,
        locationName: updatedOrder.event.locationName,
        totalKits: updatedOrder.totalKits,
        paidBookingCount: updatedOrder.paidBookingCount,
        shippingName: updatedOrder.shippingName,
        shippingAddress: updatedOrder.shippingAddress,
        shippingCity: updatedOrder.shippingCity,
        shippingState: updatedOrder.shippingState,
        shippingZip: updatedOrder.shippingZip,
        shippingAmountCents: updatedOrder.shippingAmountCents,
        shippingProvider: updatedOrder.shippingProvider,
        shippingService: updatedOrder.shippingService,
        trackingNumber: updatedOrder.trackingNumber,
        trackingStatus: updatedOrder.trackingStatus,
        trackingUrl: updatedOrder.trackingUrl,
      }).catch((emailError: unknown) => {
        console.error("Event shipping label email failed:", {
          eventShippingOrderId: updatedOrder.id,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (labelError) {
    console.error("Admin event Shippo label purchase failed:", {
      eventShippingOrderId: order.id,
      error: labelError instanceof Error ? labelError.message : String(labelError),
    });

    return NextResponse.json(
      { error: labelError instanceof Error ? labelError.message : "Shippo label purchase failed." },
      { status: 500 },
    );
  }
}
