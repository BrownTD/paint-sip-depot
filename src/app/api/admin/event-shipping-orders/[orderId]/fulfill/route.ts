import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { requireAdminApiSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { error } = await requireAdminApiSession();
  if (error) return error;

  const { orderId } = await context.params;
  const order = await prisma.eventShippingOrder.findUnique({ where: { id: orderId } });

  if (!order) {
    return NextResponse.json({ error: "Event shipping order not found." }, { status: 404 });
  }

  if (order.status !== ShopOrderStatus.PAID && order.status !== ShopOrderStatus.FULFILLED) {
    return NextResponse.json({ error: "Only paid event shipping orders can be marked fulfilled." }, { status: 409 });
  }

  const updatedOrder = await prisma.eventShippingOrder.update({
    where: { id: order.id },
    data: {
      status: ShopOrderStatus.FULFILLED,
      shippoOrderStatus: order.shippoOrderStatus ?? "SHIPPED",
    },
  });

  return NextResponse.json({ order: updatedOrder });
}
