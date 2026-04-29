ALTER TABLE "return_submissions"
  ADD COLUMN "decisionReason" TEXT,
  ADD COLUMN "customerMessage" TEXT,
  ADD COLUMN "resolutionType" TEXT,
  ADD COLUMN "refundAmountCents" INTEGER,
  ADD COLUMN "stripeRefundId" TEXT,
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "replacementOrderId" TEXT,
  ADD COLUMN "replacementCreatedAt" TIMESTAMP(3),
  ADD COLUMN "returnLabelUrl" TEXT,
  ADD COLUMN "returnLabelTrackingUrl" TEXT,
  ADD COLUMN "returnLabelTrackingNumber" TEXT,
  ADD COLUMN "returnLabelTransactionId" TEXT,
  ADD COLUMN "returnLabelCreatedAt" TIMESTAMP(3),
  ADD COLUMN "customerNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE INDEX "return_submissions_replacementOrderId_idx" ON "return_submissions"("replacementOrderId");
