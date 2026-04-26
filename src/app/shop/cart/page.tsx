import type { Metadata } from "next";
import { ShopCartPageContent, ShopChrome, ShopFooter } from "@/components/shop/shop-shell";
import { getStorefrontNavCategories } from "@/lib/products";
import { getCategoryDisplayName } from "@/lib/product-catalog";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your Paint & Sip Depot cart and continue to checkout.",
};

export default async function ShopCartPage() {
  const categories = await getStorefrontNavCategories();

  return (
    <ShopChrome
      categories={categories.map((category) => ({
        ...category,
        name: getCategoryDisplayName(category.id, category.name),
      }))}
    >
      <ShopCartPageContent />
      <ShopFooter />
    </ShopChrome>
  );
}
