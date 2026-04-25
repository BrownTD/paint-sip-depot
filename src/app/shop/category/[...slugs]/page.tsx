import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GoogleReviewsSection } from "@/components/shop/google-reviews-section";
import { ShopProductCard } from "@/components/shop/shop-product-card";
import {
  ShopChrome,
  ShopFooter,
  ShopNewsletterSection,
} from "@/components/shop/shop-shell";
import {
  formatProductPriceRange,
  getDiscountCompareAtCents,
  getProductReviewStats,
  getStorefrontCategoryProducts,
  shouldRenderCouplesImagePair,
} from "@/lib/products";
import { getCategoryBadgeLabel, getCategoryDisplayName } from "@/lib/product-catalog";

type CategoryPageParams = {
  slugs: string[];
};

function mapProduct(product: Awaited<ReturnType<typeof getStorefrontCategoryProducts>>["products"][number]) {
  const reviewStats = getProductReviewStats(product.reviews);

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    categoryId: product.categoryId,
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
}

async function getCategoryPageData(params: CategoryPageParams) {
  const [categorySlug, subcategorySlug] = params.slugs;

  if (!categorySlug || params.slugs.length > 2) {
    return null;
  }

  const data = await getStorefrontCategoryProducts({
    categorySlug,
    subcategorySlug,
  });

  if (!data.category) {
    return null;
  }

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: CategoryPageParams;
}): Promise<Metadata> {
  const data = await getCategoryPageData(params);

  if (!data) {
    return {
      title: "Shop Category",
    };
  }

  const categoryName = getCategoryDisplayName(data.category.id, data.category.name);
  const title = data.subcategory ? `${data.subcategory.name} ${categoryName}` : categoryName;

  return {
    title,
    description: `Shop ${title} from Paint & Sip Depot.`,
  };
}

export default async function ShopCategoryPage({
  params,
}: {
  params: CategoryPageParams;
}) {
  const data = await getCategoryPageData(params);

  if (!data) {
    notFound();
  }

  const categoryName = getCategoryDisplayName(data.category.id, data.category.name);
  const title = data.subcategory ? data.subcategory.name : categoryName;
  const subtitle = data.subcategory
    ? `${categoryName} / ${data.subcategory.name}`
    : `Browse all ${categoryName}`;
  const products = data.products.map(mapProduct);

  return (
    <ShopChrome
      categories={data.categories.map((category) => ({
        ...category,
        name: getCategoryDisplayName(category.id, category.name),
      }))}
    >
      <main>
        <section className="px-4 pb-10 pt-16 sm:pb-14 sm:pt-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/50">
              {subtitle}
            </p>
            <h1 className="mt-3 font-display text-5xl uppercase leading-[0.92] tracking-tight text-black sm:text-6xl">
              {title}
            </h1>
          </div>
        </section>

        <section className="px-4 pb-12 sm:pb-16">
          <div className="mx-auto max-w-7xl">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
                {products.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed bg-[#f8f7f5] px-6 py-16 text-center">
                <h2 className="font-display text-4xl uppercase tracking-tight text-black">
                  No Products Yet
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-black/60">
                  Products in this category will appear here when they are published.
                </p>
              </div>
            )}
          </div>
        </section>

        <GoogleReviewsSection />
        <ShopNewsletterSection />
      </main>

      <ShopFooter />
    </ShopChrome>
  );
}
