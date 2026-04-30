import { NextResponse } from "next/server";
import { z } from "zod";
import { buildShippoEventHostAddress, getShippoUspsRateQuote } from "@/lib/shippo";
import { prisma } from "@/lib/prisma";

const estimateSchema = z.object({
  quantity: z.coerce.number().int().min(1).default(1),
});

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = estimateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.fulfillmentMethod === "PICKUP") {
    return NextResponse.json({
      amountCents: 0,
      provider: null,
      service: null,
      estimateLabel: null,
    });
  }

  const quote = await getShippoUspsRateQuote({
    toAddress: buildShippoEventHostAddress({
      shippingRecipientName: event.shippingRecipientName,
      shippingAddress: event.shippingAddress,
      shippingCity: event.shippingCity,
      shippingState: event.shippingState,
      shippingZip: event.shippingZip,
    }),
    quantity: 1,
    metadata: `Single kit checkout estimate for event ${event.id}`,
  });

  return NextResponse.json({
    amountCents: quote.amountCents,
    provider: quote.provider,
    service: parsed.data.quantity > 1 ? `${quote.service} (single-kit guest shipping charge)` : quote.service,
    estimateLabel: quote.estimateLabel,
  });
}
