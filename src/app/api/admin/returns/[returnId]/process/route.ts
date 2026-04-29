import { NextResponse } from "next/server";
import { ShopOrderStatus } from "@prisma/client";
import { z } from "zod";

import { requireAdminApiSession } from "@/lib/admin";
import { sendCustomerReturnDecisionEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  buildShippoShopAddress,
  createShippoOrder,
  createShopOrderReturnLabel,
  getKitParcelSummary,
  getShippoUspsRateQuote,
} from "@/lib/shippo";
import { stripe } from "@/lib/stripe";

type RouteContext = {
  params: Promise<{
    returnId: string;
  }>;
};

const processReturnSchema = z
  .object({
    decision: z.enum(["APPROVED", "DENIED"]),
    resolutionType: z.enum(["REFUND", "REPLACEMENT"]).nullable().optional(),
    decisionReason: z.string().trim().max(3000).optional().default(""),
    customerMessage: z.string().trim().max(3000).optional().default(""),
    notifyCustomer: z.boolean().default(true),
    createReturnLabel: z.boolean().default(false),
    refundAmountCents: z.number().int().positive().nullable().optional(),
    replacementItems: z
      .array(
        z.object({
          orderItemId: z.string().trim().min(1),
          quantity: z.number().int().min(0).max(999),
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "APPROVED" && !data.resolutionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolutionType"],
        message: "Choose refund or replacement for approved returns.",
      });
    }

    if (data.decision === "DENIED" && data.createReturnLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["createReturnLabel"],
        message: "Denied returns cannot include a return label.",
      });
    }

    if (data.createReturnLabel && !data.notifyCustomer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notifyCustomer"],
        message: "Email the customer when sending a return label.",
      });
    }
  });

function getReplacementStatusLabel(resolutionType: "REFUND" | "REPLACEMENT" | null | undefined) {
  if (resolutionType === "REFUND") return "APPROVED_REFUND";
  if (resolutionType === "REPLACEMENT") return "APPROVED_REPLACEMENT";
  return "APPROVED";
}

async function getReturnProcessingOrder(orderId: string) {
  return prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

type ReturnProcessingOrder = NonNullable<Awaited<ReturnType<typeof getReturnProcessingOrder>>>;

async function createReplacementOrderFromOrder(
  order: ReturnProcessingOrder,
  replacementItems: Array<{ orderItemId: string; quantity: number }>,
) {
  if (
    !order.shippingName ||
    !order.shippingAddress ||
    !order.shippingCity ||
    !order.shippingState ||
    !order.shippingZip
  ) {
    throw new Error("This order is missing the shipping address needed for a replacement order.");
  }

  const selectedItems = order.items
    .map((item) => {
      const override = replacementItems.find((entry) => entry.orderItemId === item.id);
      const quantity = override?.quantity ?? item.quantity;

      return quantity > 0
        ? {
            ...item,
            quantity,
            totalPriceCents: item.unitPriceCents * quantity,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (selectedItems.length === 0) {
    throw new Error("Add at least one replacement item quantity greater than zero.");
  }

  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = selectedItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
  const shippoAddress = buildShippoShopAddress({
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingZip: order.shippingZip,
    shippingPhone: order.shippingPhone,
    customerEmail: order.customerEmail,
  });
  const shippingQuote = await getShippoUspsRateQuote({
    toAddress: shippoAddress,
    quantity: totalQuantity,
    metadata: `Replacement for ${order.id}`,
  });

  const replacementOrder = await prisma.shopOrder.create({
    data: {
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingName: order.shippingName,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingZip: order.shippingZip,
      shippingPhone: order.shippingPhone,
      shippingAmountCents: shippingQuote.amountCents,
      shippingProvider: shippingQuote.provider,
      shippingService: shippingQuote.service,
      shippingEstimatedDays: shippingQuote.estimatedDays,
      shippingArrivesBy: shippingQuote.arrivesBy,
      shippingEstimateLabel: shippingQuote.estimateLabel,
      shippoShipmentId: shippingQuote.shipmentId,
      shippoRateId: shippingQuote.rateId,
      currency: order.currency,
      status: ShopOrderStatus.PAID,
      amountSubtotalCents: subtotalCents,
      amountTotalCents: subtotalCents + shippingQuote.amountCents,
      items: {
        create: selectedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          colorOptionId: item.colorOptionId,
          productNameSnapshot: item.productNameSnapshot,
          variantLabelSnapshot: item.variantLabelSnapshot,
          colorLabelSnapshot: item.colorLabelSnapshot,
          imageUrlSnapshot: item.imageUrlSnapshot,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
          currency: item.currency,
        })),
      },
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const shippoOrder = await createShippoOrder({
    toAddress: shippoAddress,
    lineItems: replacementOrder.items.map((item) => ({
      quantity: item.quantity,
      title: item.productNameSnapshot,
      total_price: (item.totalPriceCents / 100).toFixed(2),
      currency: replacementOrder.currency.toUpperCase(),
      weight: "2",
      weight_unit: "lb",
    })),
    placedAt: replacementOrder.createdAt,
    orderNumber: replacementOrder.id,
    subtotalCents: replacementOrder.amountSubtotalCents,
    totalCents: replacementOrder.amountTotalCents,
    shippingAmountCents: replacementOrder.shippingAmountCents,
    shippingMethod: [replacementOrder.shippingProvider, replacementOrder.shippingService].filter(Boolean).join(" "),
    notes: getKitParcelSummary(totalQuantity),
    currency: replacementOrder.currency,
  });

  return prisma.shopOrder.update({
    where: { id: replacementOrder.id },
    data: shippoOrder,
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { error } = await requireAdminApiSession();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = processReturnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid return processing request." },
        { status: 400 },
      );
    }

    const { returnId } = await context.params;
    const submission = await prisma.returnSubmission.findUnique({
      where: { id: returnId },
    });

    if (!submission) {
      return NextResponse.json({ error: "Return request not found." }, { status: 404 });
    }

    if (submission.resolvedAt) {
      return NextResponse.json({ error: "This return request has already been resolved." }, { status: 409 });
    }

    const data = parsed.data;
    const order =
      data.decision === "APPROVED"
        ? await getReturnProcessingOrder(submission.orderNumber)
        : null;

    if (data.decision === "APPROVED" && !order) {
      return NextResponse.json(
        { error: "A matching shop order is required before approving this request." },
        { status: 404 },
      );
    }

    let stripeRefundId: string | null = null;
    let refundedAt: Date | null = null;
    let replacementOrderId: string | null = null;
    let replacementCreatedAt: Date | null = null;
    let returnLabelUrl: string | null = null;
    let returnLabelTrackingUrl: string | null = null;
    let returnLabelTrackingNumber: string | null = null;
    let returnLabelTransactionId: string | null = null;
    let returnLabelCreatedAt: Date | null = null;
    let customerNotifiedAt: Date | null = null;
    let warning: string | null = null;

    if (data.decision === "APPROVED" && order) {
      if (data.resolutionType === "REFUND") {
        if (!order.stripePaymentIntentId) {
          return NextResponse.json(
            { error: "This order does not have a Stripe payment intent to refund." },
            { status: 409 },
          );
        }

        const refundAmountCents = data.refundAmountCents ?? order.amountTotalCents;
        if (refundAmountCents > order.amountTotalCents) {
          return NextResponse.json(
            { error: "Refund amount cannot exceed the original order total." },
            { status: 400 },
          );
        }

        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: refundAmountCents,
          metadata: {
            returnSubmissionId: submission.id,
            orderId: order.id,
          },
        });

        stripeRefundId = refund.id;
        refundedAt = new Date();

        await prisma.shopOrder.update({
          where: { id: order.id },
          data: { status: ShopOrderStatus.REFUNDED },
        });
      }

      if (data.resolutionType === "REPLACEMENT") {
        const replacementOrder = await createReplacementOrderFromOrder(order, data.replacementItems);
        replacementOrderId = replacementOrder.id;
        replacementCreatedAt = new Date();
      }

      if (data.createReturnLabel) {
        if (
          !order.shippingName ||
          !order.shippingAddress ||
          !order.shippingCity ||
          !order.shippingState ||
          !order.shippingZip
        ) {
          return NextResponse.json(
            { error: "This order is missing the shipping address needed for a return label." },
            { status: 409 },
          );
        }

        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const returnLabel = await createShopOrderReturnLabel({
          fromAddress: buildShippoShopAddress({
            shippingName: order.shippingName,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
            shippingState: order.shippingState,
            shippingZip: order.shippingZip,
            shippingPhone: order.shippingPhone,
            customerEmail: order.customerEmail,
          }),
          quantity: totalQuantity,
          metadata: `Return ${submission.id} for ${order.id}`,
        });

        returnLabelUrl = returnLabel.labelUrl ?? null;
        returnLabelTrackingUrl = returnLabel.trackingUrl ?? null;
        returnLabelTrackingNumber = returnLabel.trackingNumber ?? null;
        returnLabelTransactionId = returnLabel.shippoTransactionId;
        returnLabelCreatedAt = new Date();
      }
    }

    const status =
      data.decision === "DENIED" ? "DENIED" : getReplacementStatusLabel(data.resolutionType);

    const updatedSubmission = await prisma.returnSubmission.update({
      where: { id: submission.id },
      data: {
        status,
        adminNotes: data.decisionReason || null,
        decisionReason: data.decisionReason || null,
        customerMessage: data.customerMessage || null,
        resolutionType: data.decision === "APPROVED" ? data.resolutionType ?? null : null,
        refundAmountCents:
          data.decision === "APPROVED" && data.resolutionType === "REFUND"
            ? data.refundAmountCents ?? order?.amountTotalCents ?? null
            : null,
        stripeRefundId,
        refundedAt,
        replacementOrderId,
        replacementCreatedAt,
        returnLabelUrl,
        returnLabelTrackingUrl,
        returnLabelTrackingNumber,
        returnLabelTransactionId,
        returnLabelCreatedAt,
        resolvedAt: new Date(),
      },
    });

    if (data.notifyCustomer) {
      try {
        await sendCustomerReturnDecisionEmail({
          orderNumber: submission.orderNumber,
          customerName: submission.customerName,
          customerEmail: submission.customerEmail,
          status: data.decision,
          resolutionType: data.decision === "APPROVED" ? data.resolutionType ?? null : null,
          decisionReason: data.decisionReason || null,
          customerMessage: data.customerMessage || null,
          refundAmountCents:
            data.decision === "APPROVED" && data.resolutionType === "REFUND"
              ? data.refundAmountCents ?? order?.amountTotalCents ?? null
              : null,
          replacementOrderId,
          returnLabelUrl,
          returnTrackingNumber: returnLabelTrackingNumber,
          returnTrackingUrl: returnLabelTrackingUrl,
        });
        customerNotifiedAt = new Date();
      } catch (emailError) {
        console.error("Return decision email failed:", {
          returnSubmissionId: submission.id,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
        warning = "The request was processed, but the customer email failed to send.";
      }
    }

    const finalSubmission =
      customerNotifiedAt !== null
        ? await prisma.returnSubmission.update({
            where: { id: submission.id },
            data: { customerNotifiedAt },
          })
        : updatedSubmission;

    return NextResponse.json({
      submission: finalSubmission,
      warning,
    });
  } catch (error) {
    console.error("Return processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process return request." },
      { status: 500 },
    );
  }
}
