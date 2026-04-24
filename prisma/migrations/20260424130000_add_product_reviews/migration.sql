CREATE TABLE "public"."product_reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerEmail" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_reviews_productId_createdAt_idx" ON "public"."product_reviews"("productId", "createdAt");
CREATE INDEX "product_reviews_productId_rating_idx" ON "public"."product_reviews"("productId", "rating");
CREATE INDEX "product_reviews_reviewerEmail_idx" ON "public"."product_reviews"("reviewerEmail");

ALTER TABLE "public"."product_reviews"
ADD CONSTRAINT "product_reviews_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
