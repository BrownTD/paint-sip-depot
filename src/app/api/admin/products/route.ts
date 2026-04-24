import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin";
import { ProductServiceError, createProductWithStripe, getAdminProducts } from "@/lib/products";
import { productSchema } from "@/lib/validations";

export async function GET() {
  const { error } = await requireAdminApiSession();
  if (error) {
    return error;
  }

  try {
    const products = await getAdminProducts();
    return NextResponse.json({ products });
  } catch (routeError) {
    console.error("Admin products fetch error:", routeError);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdminApiSession();
  if (error) {
    return error;
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const product = await createProductWithStripe(parsed.data);
    return NextResponse.json({ product }, { status: 201 });
  } catch (routeError) {
    console.error("Admin product creation error:", routeError);
    return NextResponse.json(
      {
        error:
          routeError instanceof Error ? routeError.message : "Failed to create product.",
      },
      { status: routeError instanceof ProductServiceError ? routeError.status : 500 },
    );
  }
}
