import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ReturnRequestDetail } from "@/components/admin/return-request-detail";
import { Button } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export default async function AdminReturnRequestPage({
  params,
}: {
  params: Promise<{ returnId: string }>;
}) {
  await requireAdminSession();
  const { returnId } = await params;

  const submission = await prisma.returnSubmission.findUnique({
    where: { id: returnId },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      phoneNumber: true,
      issueType: true,
      description: true,
      photoUrls: true,
      didNotReceiveOrder: true,
      status: true,
      decisionReason: true,
      customerMessage: true,
      resolutionType: true,
      refundAmountCents: true,
      replacementOrderId: true,
      returnLabelUrl: true,
      returnLabelTrackingUrl: true,
      returnLabelTrackingNumber: true,
      customerNotifiedAt: true,
      resolvedAt: true,
      createdAt: true,
    },
  });

  if (!submission) {
    notFound();
  }

  const order = await prisma.shopOrder.findUnique({
    where: { id: submission.orderNumber },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          variantId: true,
          colorOptionId: true,
          productNameSnapshot: true,
          variantLabelSnapshot: true,
          colorLabelSnapshot: true,
          imageUrlSnapshot: true,
          quantity: true,
          unitPriceCents: true,
          totalPriceCents: true,
          currency: true,
        },
      },
    },
  });

  const replacementOrder = submission.replacementOrderId
    ? await prisma.shopOrder.findUnique({
        where: { id: submission.replacementOrderId },
        select: {
          id: true,
          status: true,
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/admin/returns">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to return requests
        </Link>
      </Button>

      <ReturnRequestDetail
        submission={{
          ...submission,
          customerNotifiedAt: submission.customerNotifiedAt?.toISOString() ?? null,
          resolvedAt: submission.resolvedAt?.toISOString() ?? null,
          createdAt: submission.createdAt.toISOString(),
        }}
        order={
          order
            ? {
                ...order,
                createdAt: order.createdAt.toISOString(),
              }
            : null
        }
        replacementOrder={replacementOrder}
      />
    </div>
  );
}
