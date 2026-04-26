"use client";

import { ProductDetailContent, type ProductDetailData } from "@/components/shop/product-detail-content";
import { useShopCart } from "@/components/shop/shop-shell";

export function ProductDetailPageClient({ product }: { product: ProductDetailData }) {
  const { addItem } = useShopCart();

  return (
    <ProductDetailContent
      product={product}
      onAddToCart={async ({ productId, quantity, sizeId, colorId, colorLabel, stripePriceId }) => {
        const selectedSize =
          product.sizeOptions.find((size) => size.id === sizeId) ?? product.sizeOptions[0] ?? null;

        addItem({
          productId,
          productName: product.name,
          imageUrl: product.imageUrls[0] ?? null,
          quantity,
          unitPriceCents: selectedSize?.priceCents ?? product.priceCents,
          currency: selectedSize?.currency ?? product.currency,
          colorOptionId: colorId,
          colorLabel,
          variantId: sizeId,
          variantLabel: selectedSize?.label ?? null,
          stripePriceId: stripePriceId ?? selectedSize?.stripePriceId ?? product.stripePriceId,
        });
      }}
    />
  );
}
