import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const orders = await prisma.shopOrder.findMany({
      where: {
        customerEmail: {
          equals: email,
          mode: "insensitive",
        },
        status: ShopOrderStatus.PAID,
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt.toISOString(),
        amountTotalCents: order.amountTotalCents,
        currency: order.currency,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productNameSnapshot,
          variantLabel: item.variantLabelSnapshot,
          colorLabel: item.colorLabelSnapshot,
          quantity: item.quantity,
        })),
      })),
    });
  } catch (error) {
    console.error("Return order lookup error:", error);
    return NextResponse.json({ error: "Failed to search orders." }, { status: 500 });
  }
}
