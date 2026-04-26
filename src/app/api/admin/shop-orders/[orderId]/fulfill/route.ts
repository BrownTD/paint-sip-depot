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
  const order = await prisma.shopOrder.findUnique({ where: { id: orderId } });

  if (!order) {
    return NextResponse.json({ error: "Shop order not found." }, { status: 404 });
  }

  if (order.status !== ShopOrderStatus.PAID && order.status !== ShopOrderStatus.FULFILLED) {
    return NextResponse.json({ error: "Only paid shop orders can be marked fulfilled." }, { status: 409 });
  }

  const updatedOrder = await prisma.shopOrder.update({
    where: { id: order.id },
    data: {
      status: ShopOrderStatus.FULFILLED,
      shippoOrderStatus: order.shippoOrderStatus ?? "SHIPPED",
    },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ order: updatedOrder });
}
