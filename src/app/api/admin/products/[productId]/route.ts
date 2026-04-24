import { NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdminApiSession } from "@/lib/admin";
import {
  ProductServiceError,
  getProductForEditing,
  setProductStatus,
  updateProductWithStripe,
} from "@/lib/products";
import { productSchema } from "@/lib/validations";

const productStatusSchema = z
  .object({
    status: z.nativeEnum(ProductStatus),
  })
  .strict();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { error } = await requireAdminApiSession();
  if (error) {
    return error;
  }

  const { productId } = await params;

  try {
    const product = await getProductForEditing(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (routeError) {
    console.error("Admin product fetch error:", routeError);
    return NextResponse.json({ error: "Failed to fetch product." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { error } = await requireAdminApiSession();
  if (error) {
    return error;
  }

  const { productId } = await params;

  try {
    const body = await request.json();

    const statusOnly = productStatusSchema.safeParse(body);
    if (statusOnly.success) {
      const product = await setProductStatus(productId, statusOnly.data.status);
      return NextResponse.json({ product });
    }

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const product = await updateProductWithStripe(productId, parsed.data);
    return NextResponse.json({ product });
  } catch (routeError) {
    console.error("Admin product update error:", routeError);
    return NextResponse.json(
      {
        error:
          routeError instanceof Error ? routeError.message : "Failed to update product.",
      },
      { status: routeError instanceof ProductServiceError ? routeError.status : 500 },
    );
  }
}
