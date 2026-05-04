import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoogleReviewsSection } from "@/components/shop/google-reviews-section";
import {
  ShopProductCard,
  type StorefrontProductCardData,
} from "@/components/shop/shop-product-card";
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

export const dynamic = "force-dynamic";

function mapProduct(product: Awaited<ReturnType<typeof getStorefrontCategoryProducts>>["products"][number]) {
  const reviewStats = getProductReviewStats(product.reviews);
  const pairProduct = product.couplesPairProduct;

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
    couplesBundleName: product.couplesBundleName,
    couplesSlot: product.couplesSlot,
    couplesPairProduct: pairProduct
      ? {
          id: pairProduct.id,
          name: pairProduct.name,
          imageUrls: pairProduct.imageUrls,
          priceCents: pairProduct.priceCents,
          currency: pairProduct.currency,
          colorOptions: pairProduct.colorOptions.map((colorOption) => ({
            id: colorOption.id,
            label: colorOption.label,
            hex: colorOption.hex,
          })),
          variants: pairProduct.variants.map((variant) => ({
            id: variant.id,
            size: variant.size,
            label: variant.label,
            priceCents: variant.priceCents,
            currency: variant.currency,
            stripePriceId: variant.stripePriceId,
            isDefault: variant.isDefault,
          })),
        }
      : null,
    priceDisplay: formatProductPriceRange(product),
    priceCents: product.priceCents + (pairProduct?.priceCents ?? 0),
    compareAtCents: getDiscountCompareAtCents(product.priceCents + (pairProduct?.priceCents ?? 0), product.discountPercent),
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

function ShopBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-2 rounded-full text-sm font-semibold text-black/65 transition hover:text-black"
    >
      <span className="text-lg leading-none">←</span>
      {label}
    </Link>
  );
}

function HorizontalProductScroller({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: StorefrontProductCardData[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden py-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl uppercase tracking-tight text-black sm:text-4xl">
          {title}
        </h2>
        <Link href={href} className="shrink-0 text-sm font-semibold text-black/60 transition hover:text-black">
          View All
        </Link>
      </div>

      <div className="no-scrollbar relative left-1/2 mt-6 flex w-screen -translate-x-1/2 snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:gap-5 sm:scroll-px-[max(1rem,calc((100vw-80rem)/2+1rem))] sm:px-[max(1rem,calc((100vw-80rem)/2+1rem))] lg:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[68vw] max-w-[260px] shrink-0 snap-start last:snap-end sm:w-[260px] lg:w-[290px] lg:max-w-[290px]"
          >
            <ShopProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
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
  const isAllPaintKitsPage = data.category.id === "cat_canvases" && !data.subcategory;
  const backHref = data.subcategory ? `/shop/category/${data.category.slug}` : "/shop";
  const backLabel = data.subcategory ? `Back to ${categoryName}` : "Back to Shop";
  const productsBySubcategory = data.category.subcategories
    .map((subcategory) => ({
      subcategory,
      products: products.filter((product) => product.subcategoryName === subcategory.name),
    }))
    .filter((section) => section.products.length > 0);
  const uncategorizedProducts = products.filter((product) => !product.subcategoryName);

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
            <ShopBackLink href={backHref} label={backLabel} />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-black/50">
              {subtitle}
            </p>
            <h1 className="mt-3 font-display text-5xl uppercase leading-[0.92] tracking-tight text-black sm:text-6xl">
              {title}
            </h1>
          </div>
        </section>

        <section className="px-4 pb-12 sm:pb-16">
          <div className="mx-auto max-w-7xl">
            {isAllPaintKitsPage && products.length > 0 ? (
              <div className="space-y-6">
                {productsBySubcategory.map((section) => (
                  <HorizontalProductScroller
                    key={section.subcategory.id}
                    title={section.subcategory.name}
                    href={`/shop/category/${data.category.slug}/${section.subcategory.slug}`}
                    products={section.products}
                  />
                ))}
                <HorizontalProductScroller
                  title="More Paint Kits"
                  href={`/shop/category/${data.category.slug}`}
                  products={uncategorizedProducts}
                />
              </div>
            ) : products.length > 0 ? (
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
