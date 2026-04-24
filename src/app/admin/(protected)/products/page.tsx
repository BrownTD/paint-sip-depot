import { requireAdminSession } from "@/lib/admin";
import { getCategoryDisplayName } from "@/lib/product-catalog";
import { formatDate } from "@/lib/utils";
import { formatProductPriceRange, getAdminProducts } from "@/lib/products";
import { AdminProductsPageContent } from "@/components/admin/admin-products-page-content";

export default async function AdminProductsPage() {
  await requireAdminSession();

  const products = await getAdminProducts();
  const rows = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    thumbnailUrl: product.imageUrls[0] ?? null,
    categoryName: getCategoryDisplayName(product.categoryId, product.category.name),
    subcategoryName: product.subcategory?.name ?? null,
    priceDisplay: formatProductPriceRange(product),
    currency: product.currency.toUpperCase(),
    status: product.status,
    createdAtLabel: formatDate(product.createdAt),
    orderCount: product._count.orderItems,
  }));

  return <AdminProductsPageContent products={rows} />;
}
