import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { getProductCategories, getProductForEditing } from "@/lib/products";
import { ProductForm } from "@/components/admin/product-form";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireAdminSession();

  const { productId } = await params;
  const [categories, product] = await Promise.all([
    getProductCategories(),
    getProductForEditing(productId),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      mode="edit"
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        subcategories: category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
        })),
      }))}
      initialProduct={{
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        imageUrls: product.imageUrls,
        status: product.status,
        priceCents: product.priceCents,
        discountPercent: product.discountPercent,
        currency: product.currency,
        colorOptions: product.colorOptions.map((colorOption) => ({
          id: colorOption.id,
          label: colorOption.label,
          hex: colorOption.hex,
        })),
        variants: product.variants.map((variant) => ({
          size: variant.size,
          priceCents: variant.priceCents,
          currency: variant.currency,
        })),
      }}
    />
  );
}
