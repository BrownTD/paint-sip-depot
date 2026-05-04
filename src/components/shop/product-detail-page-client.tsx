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
        const pairedSize =
          product.couplesPairProduct && selectedSize
            ? product.couplesPairProduct.sizeOptions.find((size) => size.size === selectedSize.size) ??
              product.couplesPairProduct.sizeOptions.find((size) => size.isDefault) ??
              product.couplesPairProduct.sizeOptions[0] ??
              null
            : null;

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

        if (product.couplesPairProduct) {
          addItem({
            productId: product.couplesPairProduct.id,
            productName: product.couplesPairProduct.name,
            imageUrl: product.couplesPairProduct.imageUrls[0] ?? null,
            quantity,
            unitPriceCents: pairedSize?.priceCents ?? product.couplesPairProduct.priceCents,
            currency: pairedSize?.currency ?? product.couplesPairProduct.currency,
            colorOptionId: null,
            colorLabel: null,
            variantId: pairedSize?.id ?? null,
            variantLabel: pairedSize?.label ?? null,
            stripePriceId: pairedSize?.stripePriceId ?? null,
          });
        }
      }}
    />
  );
}
