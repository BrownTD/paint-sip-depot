import { NextResponse } from "next/server";
import { ProductStatus, ShopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productReviewSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  try {
    const body = await request.json();
    const parsed = productReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: ProductStatus.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const reviewerEmail = parsed.data.reviewerEmail.trim().toLowerCase();
    const reviewerName = parsed.data.reviewerName.trim();
    const bodyText = parsed.data.body.trim();

    const verifiedPurchase = await prisma.shopOrderItem.findFirst({
      where: {
        productId,
        order: {
          status: ShopOrderStatus.PAID,
          customerEmail: reviewerEmail,
        },
      },
      select: {
        id: true,
      },
    });

    const review = await prisma.productReview.create({
      data: {
        productId,
        reviewerName,
        reviewerEmail,
        rating: parsed.data.rating,
        body: bodyText,
        imageUrl: parsed.data.imageUrl?.trim() || null,
        isVerifiedPurchase: Boolean(verifiedPurchase),
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Product review creation error:", error);
    return NextResponse.json({ error: "Failed to create review." }, { status: 500 });
  }
}
