import { requireAdminSession } from "@/lib/admin";
import { getProductCategories } from "@/lib/products";
import { ProductForm } from "@/components/admin/product-form";

export default async function AdminNewProductPage() {
  await requireAdminSession();

  const categories = await getProductCategories();

  return (
    <ProductForm
      mode="create"
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        subcategories: category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
        })),
      }))}
    />
  );
}
