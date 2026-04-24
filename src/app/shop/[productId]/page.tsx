import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type ProductDetailData } from "@/components/shop/product-detail-content";
import { ProductDetailPageClient } from "@/components/shop/product-detail-page-client";
import {
  ShopChrome,
  ShopNewsletterSection,
} from "@/components/shop/shop-shell";
import {
  getDiscountCompareAtCents,
  getProductReviewStats,
  getStorefrontProductDetail,
} from "@/lib/products";
import { getCategoryBadgeLabel, getCategoryDisplayName } from "@/lib/product-catalog";

function getShortDescription(description: string) {
  const firstParagraph = description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find(Boolean);

  if (!firstParagraph) {
    return "";
  }

  return firstParagraph.replace(/\n/g, " ");
}

function buildMockFaqs() {
  return [
    {
      id: "faq-included",
      question: "What’s included in each kit?",
      answer:
        "Each kit includes a pre-drawn canvas, acrylic paints, brushes, a palette, disposable apron, tabletop easel, and water cup-everything you need to start painting.",
    },
    {
      id: "faq-supplies",
      question: "Do I need any additional supplies?",
      answer:
        "Nope. Everything you need is included in the kit. Just bring water, your favorite drink, and you’re ready to go.",
    },
    {
      id: "faq-beginner",
      question: "Is this beginner-friendly?",
      answer:
        "Yes. Our kits are designed for all skill levels, including beginners. The pre-drawn canvas makes it easy to follow along and create something you’ll love.",
    },
    {
      id: "faq-duration",
      question: "How long does it take to complete a painting?",
      answer:
        "Most sessions take about 1.5 to 2 hours, depending on your pace.",
    },
    {
      id: "faq-predrawn",
      question: "Are the canvases pre-drawn or blank?",
      answer:
        "Your canvas comes pre-drawn to guide you through the painting process-no sketching required.",
    },
    {
      id: "faq-paints",
      question: "Are the paints washable?",
      answer:
        "Acrylic paint is not fully washable, so we recommend using the included apron and protecting your workspace.",
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: { productId: string };
}): Promise<Metadata> {
  const { product } = await getStorefrontProductDetail(params.productId);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: getShortDescription(product.description),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { productId: string };
}) {
  const { product, relatedProducts, categories } = await getStorefrontProductDetail(params.productId);

  if (!product) {
    notFound();
  }

  const categoryName = getCategoryDisplayName(product.categoryId, product.category.name);
  const badgeCategoryName = getCategoryBadgeLabel(product.categoryId, product.category.name);
  const reviewStats = getProductReviewStats(product.reviews);
  const sizeOptions =
    product.variants.length > 0
      ? product.variants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          priceCents: variant.priceCents,
          currency: variant.currency,
          stripePriceId: variant.stripePriceId,
          isDefault: variant.isDefault,
        }))
      : [
          {
            id: "standard",
            label: "Standard",
            priceCents: product.priceCents,
            currency: product.currency,
            stripePriceId: product.stripePriceId,
            isDefault: true,
          },
        ];

  const detailProduct: ProductDetailData = {
    id: product.id,
    name: product.name,
    description: product.description,
    shortDescription: getShortDescription(product.description),
    imageUrls: product.imageUrls,
    breadcrumbs: [
      { label: "Shop", href: "/shop" },
      { label: categoryName, href: `/shop/category/${product.category.slug}` },
      ...(product.subcategory
        ? [
            {
              label: product.subcategory.name,
              href: `/shop/category/${product.category.slug}/${product.subcategory.slug}`,
            },
          ]
        : []),
      { label: product.name },
    ],
    rating: reviewStats.averageRating,
    reviewCount: reviewStats.reviewCount,
    priceCents: product.priceCents,
    discountPercent: product.discountPercent,
    currency: product.currency,
    stripePriceId: product.stripePriceId,
    categoryId: product.categoryId,
    categoryName: badgeCategoryName,
    subcategoryName: product.subcategory?.name ?? null,
    colorOptions: product.colorOptions.map((colorOption) => ({
      id: colorOption.id,
      label: colorOption.label,
      hex: colorOption.hex,
    })),
    sizeOptions,
    reviews: product.reviews.map((review) => ({
      id: review.id,
      name: review.reviewerName,
      rating: review.rating,
      body: review.body,
      dateLabel: new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(review.createdAt),
      verified: review.isVerifiedPurchase,
      imageUrl: review.imageUrl,
      createdAt: review.createdAt.toISOString(),
    })),
    faqs: buildMockFaqs(),
    relatedProducts: relatedProducts.map((relatedProduct) => {
      const relatedReviewStats = getProductReviewStats(relatedProduct.reviews);

      return {
      id: relatedProduct.id,
      href: `/shop/${relatedProduct.id}`,
      name: relatedProduct.name,
      imageUrl: relatedProduct.imageUrls[0] ?? null,
      priceCents: relatedProduct.priceCents,
      compareAtCents: getDiscountCompareAtCents(
        relatedProduct.priceCents,
        relatedProduct.discountPercent,
      ),
      currency: relatedProduct.currency,
      rating: relatedReviewStats.averageRating,
      reviewCount: relatedReviewStats.reviewCount,
      };
    }),
  };

  return (
    <ShopChrome
      categories={categories.map((category) => ({
        ...category,
        name: getCategoryDisplayName(category.id, category.name),
      }))}
    >
      <main>
        <ProductDetailPageClient product={detailProduct} />
        <ShopNewsletterSection />
      </main>
    </ShopChrome>
  );
}
