import { requireAdminSession } from "@/lib/admin";
import { getProductCategories } from "@/lib/products";
import { BatchPaintKitForm } from "@/components/admin/batch-paint-kit-form";

export default async function AdminBatchCreateProductsPage() {
  await requireAdminSession();

  const categories = await getProductCategories();
  const paintKitCategory = categories.find((category) => category.id === "cat_canvases");

  return (
    <BatchPaintKitForm
      subcategories={
        paintKitCategory?.subcategories.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
        })) ?? []
      }
    />
  );
}