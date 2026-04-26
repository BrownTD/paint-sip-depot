import { NextResponse } from "next/server";
import { z } from "zod";
import { buildShippoShopAddress, getShippoUspsRateQuote } from "@/lib/shippo";
import { shopCartCheckoutItemSchema } from "@/lib/validations";

const shippingEstimateSchema = z.object({
  items: z.array(shopCartCheckoutItemSchema).min(1, "Add at least one item before estimating shipping"),
  shippingAddress: z.string().min(3, "Shipping address is required"),
  shippingCity: z.string().min(2, "Shipping city is required"),
  shippingState: z.string().trim().length(2, "Use the 2-letter shipping state"),
  shippingZip: z.string().min(5, "Shipping ZIP code is required"),
  shippingName: z.string().optional().nullable(),
  shippingPhone: z.string().optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = shippingEstimateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid shipping estimate request." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const quote = await getShippoUspsRateQuote({
      toAddress: buildShippoShopAddress({
        shippingName: data.shippingName?.trim() || "Paint & Sip Depot Customer",
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState.toUpperCase(),
        shippingZip: data.shippingZip,
        shippingPhone: data.shippingPhone,
        customerEmail: data.customerEmail,
      }),
      quantity: totalQuantity,
      metadata: "Shop checkout shipping estimate",
    });

    return NextResponse.json({
      provider: quote.provider,
      service: quote.service,
      estimatedDays: quote.estimatedDays,
      arrivesBy: quote.arrivesBy,
      estimateLabel: quote.estimateLabel,
    });
  } catch (error) {
    console.error("Shop shipping estimate error:", error);
    return NextResponse.json(
      { error: "Failed to load shipping estimate." },
      { status: 500 },
    );
  }
}
