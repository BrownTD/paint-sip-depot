import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin";
import { createProductWithStripe, ProductServiceError } from "@/lib/products";
import {
  CANVASES_CATEGORY_ID,
  CANVAS_DEFAULT_DESCRIPTION,
  CANVAS_DEFAULT_LARGE_PRICE,
  CANVAS_DEFAULT_MEDIUM_PRICE,
  DEFAULT_PRODUCT_CURRENCY,
  PRODUCT_VARIANT_SIZE,
} from "@/lib/product-catalog";
import { productSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { error } = await requireAdminApiSession();
  if (error) return error;

  try {
    const body = await request.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Add at least one product row." }, { status: 400 });
    }

    const createdProducts = [];

    for (const row of rows) {
      const parsed = productSchema.safeParse({
        name: row.name,
        description: CANVAS_DEFAULT_DESCRIPTION,
        currency: DEFAULT_PRODUCT_CURRENCY,
        categoryId: CANVASES_CATEGORY_ID,
        subcategoryId: row.subcategoryId,
        imageUrls: row.imageUrls,
        status: "ACTIVE",
        basePrice: CANVAS_DEFAULT_MEDIUM_PRICE,
        discountPercent: null,
        colorOptions: row.colorOptions ?? [],
        variants: [
          {
            size: PRODUCT_VARIANT_SIZE.medium,
            price: CANVAS_DEFAULT_MEDIUM_PRICE,
            currency: DEFAULT_PRODUCT_CURRENCY,
          },
          {
            size: PRODUCT_VARIANT_SIZE.large,
            price: CANVAS_DEFAULT_LARGE_PRICE,
            currency: DEFAULT_PRODUCT_CURRENCY,
          },
        ],
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: `${row.name || "Product"}: ${parsed.error.errors[0].message}` },
          { status: 400 },
        );
      }

      const product = await createProductWithStripe(parsed.data);
      createdProducts.push(product);
    }

    return NextResponse.json({ products: createdProducts }, { status: 201 });
  } catch (routeError) {
    console.error("Batch product creation error:", routeError);

    return NextResponse.json(
      {
        error: routeError instanceof Error ? routeError.message : "Failed to create batch products.",
      },
      { status: routeError instanceof ProductServiceError ? routeError.status : 500 },
    );
  }
}