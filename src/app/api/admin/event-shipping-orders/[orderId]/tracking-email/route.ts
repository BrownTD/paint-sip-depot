import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin";
import { sendHostEventShippingTrackingEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
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
    return NextResponse.json({ error: "Only paid event shipping orders can receive tracking emails." }, { status: 409 });
  }

  if (!order.hostEmail) {
    return NextResponse.json({ error: "This event shipping order is missing the host email." }, { status: 409 });
  }

  await sendHostEventShippingTrackingEmail({
    to: order.hostEmail,
    recipientName: order.hostName,
    eventTitle: order.event.title,
    eventUrl: getAbsoluteUrl(`/e/${order.event.slug}`),
    startDateTime: order.event.startDateTime,
    locationName: order.event.locationName,
    totalKits: order.totalKits,
    paidBookingCount: order.paidBookingCount,
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingZip: order.shippingZip,
    shippingAmountCents: order.shippingAmountCents,
    shippingProvider: order.shippingProvider,
    shippingService: order.shippingService,
    trackingNumber: order.trackingNumber,
    trackingStatus: order.trackingStatus,
    trackingUrl: order.trackingUrl,
  });

  return NextResponse.json({ sent: true });
}
