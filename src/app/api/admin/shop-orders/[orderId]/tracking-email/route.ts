import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendShopOrderTrackingEmail } from "@/lib/shop-order-emails";

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
    return NextResponse.json({ error: "Only paid shop orders can receive tracking emails." }, { status: 409 });
  }

  await sendShopOrderTrackingEmail(order);

  return NextResponse.json({ sent: true });
}
