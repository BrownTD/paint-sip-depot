import type { Metadata } from "next";
import { StorefrontHome } from "@/components/shop/storefront-home";
import {
  formatProductPriceRange,
  getDiscountCompareAtCents,
  getProductReviewStats,
  getStorefrontProducts,
  shouldRenderCouplesImagePair,
} from "@/lib/products";
import { getCategoryBadgeLabel, getCategoryDisplayName } from "@/lib/product-catalog";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse canvases, paint party kits, and creative supplies curated for unforgettable Paint & Sip Depot experiences.",
};

export default async function ShopPage() {
  const { newArrivals, topSelling, themes, categories } = await getStorefrontProducts();

  const mapProduct = (product: (typeof newArrivals)[number]) => {
    const reviewStats = getProductReviewStats(product.reviews);

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      categoryName: getCategoryBadgeLabel(product.categoryId, product.category.name),
      subcategoryName: product.subcategory?.name ?? null,
      imageUrls: product.imageUrls,
      isCouples: shouldRenderCouplesImagePair(product),
      priceDisplay: formatProductPriceRange(product),
      priceCents: product.priceCents,
      compareAtCents: getDiscountCompareAtCents(product.priceCents, product.discountPercent),
      currency: product.currency,
      rating: reviewStats.averageRating,
      reviewCount: reviewStats.reviewCount,
      colorOptions: product.colorOptions.map((colorOption) => ({
        id: colorOption.id,
        label: colorOption.label,
        hex: colorOption.hex,
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        label: variant.label,
        priceCents: variant.priceCents,
        currency: variant.currency,
        stripePriceId: variant.stripePriceId,
        isDefault: variant.isDefault,
      })),
    };
  };

  return (
    <StorefrontHome
      newArrivals={newArrivals.map(mapProduct)}
      topSelling={topSelling.map(mapProduct)}
      themes={themes}
      categories={categories.map((category) => ({
        ...category,
        name: getCategoryDisplayName(category.id, category.name),
      }))}
    />
  );
}
