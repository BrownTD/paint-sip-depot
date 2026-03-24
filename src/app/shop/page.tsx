import type { Metadata } from "next";
import { StorefrontHome } from "@/components/shop/storefront-home";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse canvases, paint party kits, and creative supplies curated for unforgettable Paint & Sip Depot experiences.",
};

export default function ShopPage() {
  return <StorefrontHome />;
}
