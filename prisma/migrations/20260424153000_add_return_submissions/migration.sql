CREATE TABLE "public"."return_submissions" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "issueType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "photoUrls" TEXT[],
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "return_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "return_submissions_status_createdAt_idx" ON "public"."return_submissions"("status", "createdAt");
CREATE INDEX "return_submissions_customerEmail_idx" ON "public"."return_submissions"("customerEmail");
CREATE INDEX "return_submissions_orderNumber_idx" ON "public"."return_submissions"("orderNumber");
