import { Prisma, ProductStatus, ProductVariantSize, ShopOrderStatus } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  CANVASES_CATEGORY_ID,
  CANVAS_DEFAULT_DESCRIPTION,
  CANVAS_DEFAULT_LARGE_PRICE,
  CANVAS_DEFAULT_MEDIUM_PRICE,
  COUPLES_SUBCATEGORY_SLUG,
  DEFAULT_PRODUCT_CURRENCY,
  PAINT_CATEGORY_ID,
  PRODUCT_STATUS,
  PRODUCT_VARIANT_DEFINITIONS,
  formatSkuSequence,
  getCategorySkuCode,
  getVariantSkuCode,
  normalizeCurrency,
  normalizeProductName,
  sanitizeColorHex,
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/product-catalog";
import { getAbsoluteUrl } from "@/lib/utils";
import type { ProductColorOptionInput, ProductInput, ProductVariantInput } from "@/lib/validations";

const PRODUCT_VARIANT_ORDER: ProductVariantSize[] = [
  ProductVariantSize.MEDIUM,
  ProductVariantSize.LARGE,
];
const PAINT_KIT_TRAILING_IMAGE_PATH = "/Misc/supllies.png";

export class ProductServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const adminProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  category: true,
  subcategory: true,
  colorOptions: {
    orderBy: {
      sortOrder: "asc",
    },
  },
  variants: {
    orderBy: {
      createdAt: "asc",
    },
  },
  _count: {
    select: {
      orderItems: true,
    },
  },
});

export const storefrontProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  category: true,
  subcategory: true,
  colorOptions: {
    orderBy: {
      sortOrder: "asc",
    },
  },
  variants: {
    orderBy: {
      createdAt: "asc",
    },
  },
  reviews: {
    orderBy: {
      createdAt: "desc",
    },
  },
});

export type AdminProductRecord = Prisma.ProductGetPayload<{
  include: typeof adminProductInclude;
}>;

export type StorefrontProductRecord = Prisma.ProductGetPayload<{
  include: typeof storefrontProductInclude;
}>;

export function getProductReviewStats(
  reviews: Array<{
    rating: number;
  }>,
) {
  if (reviews.length === 0) {
    return {
      averageRating: null,
      reviewCount: 0,
    };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

type StorefrontTheme = {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  productCount: number;
};

type StorefrontNavCategory = {
  id: string;
  name: string;
  slug: string;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

async function getStorefrontNavCategories(): Promise<StorefrontNavCategory[]> {
  const categories = await prisma.productCategory.findMany({
    include: {
      subcategories: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      slug: subcategory.slug,
    })),
  }));
}

type PreparedVariant = {
  size: ProductVariantSize;
  sku: string;
  label: string;
  widthInches: number;
  heightInches: number;
  priceCents: number;
  currency: string;
  isDefault: boolean;
};

type PreparedColorOption = {
  id?: string | null;
  label: string;
  hex: string;
  sortOrder: number;
};

function getStripeProductClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ProductServiceError(
      "Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment before managing products.",
      500,
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

function toAmountCents(value: number) {
  const amountCents = Math.round(value * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new ProductServiceError("Invalid price formatting.", 400);
  }
  return amountCents;
}

function dedupeImageUrls(imageUrls: string[]) {
  return Array.from(new Set(imageUrls.map((value) => value.trim()).filter(Boolean)));
}

function isPaintKitTrailingImage(imageUrl: string) {
  const normalized = imageUrl.trim();
  const absoluteTrailingImageUrl = getAbsoluteUrl(PAINT_KIT_TRAILING_IMAGE_PATH);

  return (
    normalized === PAINT_KIT_TRAILING_IMAGE_PATH ||
    normalized === absoluteTrailingImageUrl ||
    normalized.endsWith(PAINT_KIT_TRAILING_IMAGE_PATH)
  );
}

function ensurePaintKitImageUrls(categoryId: string, imageUrls: string[]) {
  const deduped = dedupeImageUrls(imageUrls).filter((imageUrl) => !isPaintKitTrailingImage(imageUrl));

  if (!isCanvasCategory(categoryId)) {
    return deduped;
  }

  return [...deduped, getAbsoluteUrl(PAINT_KIT_TRAILING_IMAGE_PATH)];
}

function normalizeDescription(value: string) {
  return sanitizeMultilineText(value);
}

function isCanvasCategory(categoryId: string) {
  return categoryId === CANVASES_CATEGORY_ID;
}

function isPaintCategory(categoryId: string) {
  return categoryId === PAINT_CATEGORY_ID;
}

function normalizeDiscountPercent(value: number | null | undefined) {
  if (value == null) {
    return null;
  }

  const normalized = Math.round(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function prepareColorOptions(categoryId: string, colorOptions: ProductColorOptionInput[]) {
  if (!isPaintCategory(categoryId) && !isCanvasCategory(categoryId)) {
    return [];
  }

  return colorOptions.map((colorOption, index) => ({
    label: sanitizePlainText(colorOption.label),
    hex: sanitizeColorHex(colorOption.hex),
    sortOrder: index,
  }));
}

function serializeColorOptionsMetadata(colorOptions: PreparedColorOption[]) {
  return JSON.stringify(
    colorOptions.map((colorOption) => ({
      label: colorOption.label,
      hex: colorOption.hex,
    })),
  );
}

function buildStripeProductMetadata({
  categoryId,
  subcategoryId,
  sku,
  skuSequence,
  discountPercent,
  colorOptions,
}: {
  categoryId: string;
  subcategoryId?: string | null;
  sku: string;
  skuSequence: number;
  discountPercent: number | null;
  colorOptions: PreparedColorOption[];
}) {
  return {
    source: "paint-sip-depot-admin",
    categoryId,
    subcategoryId: subcategoryId ?? "",
    sku,
    skuSequence: String(skuSequence),
    discountPercent: discountPercent ? String(discountPercent) : "",
    hasColorOptions: colorOptions.length > 0 ? "true" : "false",
    paintColors: colorOptions.length > 0 ? serializeColorOptionsMetadata(colorOptions) : "",
    colorOptions: colorOptions.length > 0 ? serializeColorOptionsMetadata(colorOptions) : "",
  };
}

function buildSku(categoryId: string, variantSize: ProductVariantSize | "STANDARD", sequence: number) {
  return `PSD-${getCategorySkuCode(categoryId)}-${getVariantSkuCode(variantSize)}-${formatSkuSequence(sequence)}`;
}

async function getNextSkuSequence(categoryId: string) {
  const latestProduct = await prisma.product.findFirst({
    where: { categoryId },
    orderBy: {
      skuSequence: "desc",
    },
    select: {
      skuSequence: true,
    },
  });

  return (latestProduct?.skuSequence ?? 0) + 1;
}

function prepareVariants(categoryId: string, variants: ProductVariantInput[], sequence: number): PreparedVariant[] {
  if (!isCanvasCategory(categoryId)) {
    return [];
  }

  const variantsBySize = new Map(
    variants.map((variant) => [variant.size as ProductVariantSize, variant]),
  );

  return PRODUCT_VARIANT_ORDER.map((size) => {
    const input = variantsBySize.get(size);
    if (!input) {
      throw new ProductServiceError(`Missing ${size.toLowerCase()} variant.`, 400);
    }

    const definition = PRODUCT_VARIANT_DEFINITIONS[size];
    return {
      size,
      sku: buildSku(categoryId, size, sequence),
      label: definition.label,
      widthInches: definition.widthInches,
      heightInches: definition.heightInches,
      priceCents: toAmountCents(input.price),
      currency: normalizeCurrency(input.currency || DEFAULT_PRODUCT_CURRENCY),
      isDefault: definition.isDefault,
    };
  });
}

async function validateCategorySelection(categoryId: string, subcategoryId: string | null | undefined) {
  const category = await prisma.productCategory.findUnique({
    where: { id: categoryId },
    include: {
      subcategories: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!category) {
    throw new ProductServiceError("Selected category was not found.", 400);
  }

  if (category.id === CANVASES_CATEGORY_ID && !subcategoryId) {
    throw new ProductServiceError("Paint kit products require a sub-category.", 400);
  }

  if (category.id !== CANVASES_CATEGORY_ID && subcategoryId) {
    throw new ProductServiceError("Only paint kit products can use a sub-category.", 400);
  }

  if (!subcategoryId) {
    return { category, subcategory: null };
  }

  const subcategory = category.subcategories.find((item) => item.id === subcategoryId);
  if (!subcategory) {
    throw new ProductServiceError("Selected sub-category does not belong to the chosen category.", 400);
  }

  return { category, subcategory };
}

async function ensureUniqueProductName(normalizedName: string, excludeProductId?: string) {
  const existing = await prisma.product.findFirst({
    where: {
      normalizedName,
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ProductServiceError("A product with this name already exists.", 409);
  }
}

async function deactivateStripeProductSafely(stripeProductId: string) {
  try {
    const stripeClient = getStripeProductClient();
    await stripeClient.products.update(stripeProductId, {
      active: false,
      metadata: {
        orphaned: "true",
      },
    });
  } catch (error) {
    console.error("Failed to deactivate orphaned Stripe product:", error);
  }
}

function buildStripeProductImages(imageUrls: string[]) {
  if (imageUrls.length <= 8) {
    return imageUrls;
  }

  const trailingImageUrl = imageUrls[imageUrls.length - 1];
  if (!trailingImageUrl || !isPaintKitTrailingImage(trailingImageUrl)) {
    return imageUrls.slice(0, 8);
  }

  return [...imageUrls.slice(0, 7), trailingImageUrl];
}

function getDefaultVariant<T extends { size: ProductVariantSize }>(variants: T[]) {
  const mediumVariant = variants.find((variant) => variant.size === ProductVariantSize.MEDIUM);
  if (!mediumVariant) {
    throw new ProductServiceError("Medium variant is required.", 400);
  }
  return mediumVariant;
}

function getDefaultCanvasDescription() {
  return CANVAS_DEFAULT_DESCRIPTION;
}

function getDefaultCanvasPricing() {
  return {
    medium: CANVAS_DEFAULT_MEDIUM_PRICE,
    large: CANVAS_DEFAULT_LARGE_PRICE,
  };
}

export async function getProductCategories() {
  return prisma.productCategory.findMany({
    include: {
      subcategories: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getAdminProducts() {
  const products = await prisma.product.findMany({
    include: adminProductInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return products.map((product) => ({
    ...product,
    imageUrls: ensurePaintKitImageUrls(product.categoryId, product.imageUrls),
  }));
}

export async function getProductForEditing(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: adminProductInclude,
  });

  if (!product) {
    return null;
  }

  return {
    ...product,
    imageUrls: ensurePaintKitImageUrls(product.categoryId, product.imageUrls),
  };
}

export async function getStorefrontProducts() {
  const [fetchedProducts, paidOrderItems, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
      },
      include: storefrontProductInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.shopOrderItem.findMany({
      where: {
        order: {
          status: ShopOrderStatus.PAID,
        },
      },
      select: {
        productId: true,
        quantity: true,
      },
    }),
    getStorefrontNavCategories(),
  ]);

  const activeProducts = fetchedProducts.map((product) => ({
    ...product,
    imageUrls: ensurePaintKitImageUrls(product.categoryId, product.imageUrls),
  }));

  const soldByProductId = new Map<string, number>();
  for (const item of paidOrderItems) {
    soldByProductId.set(item.productId, (soldByProductId.get(item.productId) ?? 0) + item.quantity);
  }

  const newArrivals = activeProducts.slice(0, 8);

  const topSelling = [...activeProducts]
    .sort((a, b) => {
      const soldA = soldByProductId.get(a.id) ?? 0;
      const soldB = soldByProductId.get(b.id) ?? 0;
      if (soldA === soldB) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return soldB - soldA;
    })
    .slice(0, 8);

  const themesById = new Map<string, StorefrontTheme>();
  for (const product of activeProducts) {
    if (product.categoryId !== CANVASES_CATEGORY_ID || !product.subcategory) {
      continue;
    }

    const existingTheme = themesById.get(product.subcategory.id);
    if (existingTheme) {
      existingTheme.productCount += 1;
      if (existingTheme.imageUrls.length < 2) {
        for (const imageUrl of product.imageUrls) {
          if (existingTheme.imageUrls.length >= 2) {
            break;
          }
          if (!existingTheme.imageUrls.includes(imageUrl)) {
            existingTheme.imageUrls.push(imageUrl);
          }
        }
      }
      continue;
    }

    themesById.set(product.subcategory.id, {
      id: product.subcategory.id,
      name: product.subcategory.name,
      slug: product.subcategory.slug,
      imageUrls: product.imageUrls.slice(0, 2),
      productCount: 1,
    });
  }

  const themes = [...themesById.values()].sort((a, b) => a.name.localeCompare(b.name));

  return {
    newArrivals,
    topSelling,
    themes,
    categories,
  };
}

export async function getStorefrontCategoryProducts({
  categorySlug,
  subcategorySlug,
}: {
  categorySlug: string;
  subcategorySlug?: string;
}) {
  const [fetchedProducts, category, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
      },
      include: storefrontProductInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.productCategory.findUnique({
      where: {
        slug: categorySlug,
      },
      include: {
        subcategories: {
          orderBy: {
            name: "asc",
          },
        },
      },
    }),
    getStorefrontNavCategories(),
  ]);

  const activeProducts = fetchedProducts.map((product) => ({
    ...product,
    imageUrls: ensurePaintKitImageUrls(product.categoryId, product.imageUrls),
  }));

  if (!category) {
    return {
      category: null,
      subcategory: null,
      products: [],
      categories,
    };
  }

  const subcategory = subcategorySlug
    ? category.subcategories.find((item) => item.slug === subcategorySlug) ?? null
    : null;

  if (subcategorySlug && !subcategory) {
    return {
      category: null,
      subcategory: null,
      products: [],
      categories,
    };
  }

  const products = activeProducts.filter((product) => {
    if (product.categoryId !== category.id) {
      return false;
    }

    if (subcategory) {
      return product.subcategoryId === subcategory.id;
    }

    return true;
  });

  return {
    category,
    subcategory,
    products,
    categories,
  };
}

export async function getStorefrontProductDetail(productId: string) {
  const [fetchedProducts, product, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
      },
      include: storefrontProductInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.product.findFirst({
      where: {
        id: productId,
        status: ProductStatus.ACTIVE,
      },
      include: storefrontProductInclude,
    }),
    getStorefrontNavCategories(),
  ]);

  const activeProducts = fetchedProducts.map((item) => ({
    ...item,
    imageUrls: ensurePaintKitImageUrls(item.categoryId, item.imageUrls),
  }));

  const selectedProduct = product
    ? {
        ...product,
        imageUrls: ensurePaintKitImageUrls(product.categoryId, product.imageUrls),
      }
    : null;

  if (!selectedProduct) {
    return {
      product: null,
      relatedProducts: [],
      categories,
    };
  }

  const relatedProducts = activeProducts
    .filter((item) => item.id !== selectedProduct.id)
    .sort((a, b) => {
      const sameCategoryA = a.categoryId === selectedProduct.categoryId ? 1 : 0;
      const sameCategoryB = b.categoryId === selectedProduct.categoryId ? 1 : 0;

      if (sameCategoryA !== sameCategoryB) {
        return sameCategoryB - sameCategoryA;
      }

      const sameSubcategoryA = a.subcategoryId === selectedProduct.subcategoryId ? 1 : 0;
      const sameSubcategoryB = b.subcategoryId === selectedProduct.subcategoryId ? 1 : 0;

      if (sameSubcategoryA !== sameSubcategoryB) {
        return sameSubcategoryB - sameSubcategoryA;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 4);

  return {
    product: selectedProduct,
    relatedProducts,
    categories,
  };
}

export async function createProductWithStripe(input: ProductInput) {
  const name = sanitizePlainText(input.name);
  const normalizedName = normalizeProductName(input.name);
  const description = normalizeDescription(input.description);
  const imageUrls = ensurePaintKitImageUrls(input.categoryId, input.imageUrls);
  const discountPercent = normalizeDiscountPercent(input.discountPercent);
  const status = input.status ?? PRODUCT_STATUS.active;
  const skuSequence = await getNextSkuSequence(input.categoryId);
  const defaultSku = buildSku(input.categoryId, isCanvasCategory(input.categoryId) ? ProductVariantSize.MEDIUM : "STANDARD", skuSequence);

  await ensureUniqueProductName(normalizedName);
  const { subcategory } = await validateCategorySelection(input.categoryId, input.subcategoryId);

  const preparedVariants = prepareVariants(input.categoryId, input.variants, skuSequence);
  const preparedColorOptions = prepareColorOptions(input.categoryId, input.colorOptions);
  const stripeClient = getStripeProductClient();

  let stripeProductId: string | null = null;

  try {
    const stripeProduct = await stripeClient.products.create({
      name,
      description,
      images: buildStripeProductImages(imageUrls),
      active: status === PRODUCT_STATUS.active,
      metadata: buildStripeProductMetadata({
        categoryId: input.categoryId,
        subcategoryId: subcategory?.id ?? null,
        sku: defaultSku,
        skuSequence,
        discountPercent,
        colorOptions: preparedColorOptions,
      }),
    });
    stripeProductId = stripeProduct.id;

    const stripePrices = preparedVariants.length
      ? await Promise.all(
          preparedVariants.map(async (variant) => {
            const price = await stripeClient.prices.create({
              product: stripeProduct.id,
              unit_amount: variant.priceCents,
              currency: variant.currency,
              metadata: {
                productSource: "paint-sip-depot-admin",
                variantSize: variant.size,
                sku: variant.sku,
              },
            });

            return {
              ...variant,
              stripePriceId: price.id,
            };
          }),
        )
      : [];

    const basePriceCents =
      preparedVariants.length > 0 ? getDefaultVariant(preparedVariants).priceCents : toAmountCents(input.basePrice);
    const baseCurrency =
      preparedVariants.length > 0
        ? getDefaultVariant(preparedVariants).currency
        : normalizeCurrency(input.currency || DEFAULT_PRODUCT_CURRENCY);

    const baseStripePrice = preparedVariants.length
      ? null
      : await stripeClient.prices.create({
          product: stripeProduct.id,
          unit_amount: basePriceCents,
          currency: baseCurrency,
          metadata: {
            productSource: "paint-sip-depot-admin",
            variantSize: "STANDARD",
            sku: defaultSku,
          },
        });

    const mediumVariant = stripePrices.length ? getDefaultVariant(stripePrices) : null;

    return prisma.product.create({
      data: {
        name,
        normalizedName,
        sku: defaultSku,
        skuSequence,
        description,
        imageUrls,
        priceCents: mediumVariant?.priceCents ?? basePriceCents,
        discountPercent,
        currency: mediumVariant?.currency ?? baseCurrency,
        stripeProductId: stripeProduct.id,
        stripePriceId: mediumVariant?.stripePriceId ?? baseStripePrice?.id ?? null,
        status,
        archivedAt: status === PRODUCT_STATUS.archived ? new Date() : null,
        categoryId: input.categoryId,
        subcategoryId: subcategory?.id ?? null,
        variants: {
          create: stripePrices.map((variant) => ({
            size: variant.size,
            sku: variant.sku,
            label: variant.label,
            widthInches: variant.widthInches,
            heightInches: variant.heightInches,
            priceCents: variant.priceCents,
            currency: variant.currency,
            stripePriceId: variant.stripePriceId,
            isDefault: variant.isDefault,
          })),
        },
        colorOptions: {
          create: preparedColorOptions.map((colorOption) => ({
            label: colorOption.label,
            hex: colorOption.hex,
            sortOrder: colorOption.sortOrder,
          })),
        },
      },
      include: adminProductInclude,
    });
  } catch (error) {
    if (stripeProductId) {
      await deactivateStripeProductSafely(stripeProductId);
    }

    if (error instanceof ProductServiceError) {
      throw error;
    }

    console.error("Product creation error:", error);
    throw new ProductServiceError("Failed to create product.", 500);
  }
}

export async function updateProductWithStripe(productId: string, input: ProductInput) {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      colorOptions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!existingProduct) {
    throw new ProductServiceError("Product not found.", 404);
  }

  if (!existingProduct.stripeProductId) {
    throw new ProductServiceError(
      "This product is missing its Stripe Product ID and cannot be edited safely.",
      409,
    );
  }

  const name = sanitizePlainText(input.name);
  const normalizedName = normalizeProductName(input.name);
  const description = normalizeDescription(input.description);
  const imageUrls = ensurePaintKitImageUrls(input.categoryId, input.imageUrls);
  const discountPercent = normalizeDiscountPercent(input.discountPercent);
  const status = input.status ?? existingProduct.status;
  const defaultSku = existingProduct.sku;
  const skuSequence = existingProduct.skuSequence;

  await ensureUniqueProductName(normalizedName, productId);
  const { subcategory } = await validateCategorySelection(input.categoryId, input.subcategoryId);

  const preparedVariants = prepareVariants(input.categoryId, input.variants, skuSequence);
  const preparedColorOptions = prepareColorOptions(input.categoryId, input.colorOptions);
  const existingVariantsBySize = new Map(
    existingProduct.variants.map((variant) => [variant.size, variant]),
  );
  const existingColorOptionsByLabel = new Map(
    existingProduct.colorOptions.map((colorOption) => [colorOption.label.toLowerCase(), colorOption]),
  );
  const stripeClient = getStripeProductClient();
  const nextIsCanvas = isCanvasCategory(input.categoryId);

  try {
    await stripeClient.products.update(existingProduct.stripeProductId, {
      name,
      description,
      images: buildStripeProductImages(imageUrls),
      active: status === PRODUCT_STATUS.active,
      metadata: buildStripeProductMetadata({
        categoryId: input.categoryId,
        subcategoryId: subcategory?.id ?? null,
        sku: defaultSku,
        skuSequence,
        discountPercent,
        colorOptions: preparedColorOptions,
      }),
    });

    const nextVariants = nextIsCanvas
      ? await Promise.all(
          preparedVariants.map(async (variant) => {
            const existingVariant = existingVariantsBySize.get(variant.size);

            const priceChanged =
              existingVariant?.priceCents !== variant.priceCents ||
              normalizeCurrency(existingVariant?.currency ?? variant.currency) !== variant.currency ||
              !existingVariant?.stripePriceId ||
              !isCanvasCategory(existingProduct.categoryId);

            let stripePriceId = existingVariant?.stripePriceId ?? null;

            if (priceChanged) {
              const stripePrice = await stripeClient.prices.create({
                product: existingProduct.stripeProductId!,
                unit_amount: variant.priceCents,
                currency: variant.currency,
                metadata: {
                  productSource: "paint-sip-depot-admin",
                  variantSize: variant.size,
                  productId,
                  sku: variant.sku,
                },
              });
              stripePriceId = stripePrice.id;
            }

            return {
              ...variant,
              id: existingVariant?.id ?? null,
              stripePriceId,
            };
          }),
        )
      : [];

    const basePriceCents = nextIsCanvas
      ? getDefaultVariant(nextVariants).priceCents
      : toAmountCents(input.basePrice);
    const baseCurrency = nextIsCanvas
      ? getDefaultVariant(nextVariants).currency
      : normalizeCurrency(input.currency || DEFAULT_PRODUCT_CURRENCY);

    let defaultStripePriceId = nextIsCanvas
      ? getDefaultVariant(nextVariants).stripePriceId
      : existingProduct.stripePriceId;

    if (!nextIsCanvas) {
      const basePriceChanged =
        existingProduct.priceCents !== basePriceCents ||
        normalizeCurrency(existingProduct.currency) !== baseCurrency ||
        !existingProduct.stripePriceId ||
        isCanvasCategory(existingProduct.categoryId);

      if (basePriceChanged) {
        const stripePrice = await stripeClient.prices.create({
          product: existingProduct.stripeProductId!,
          unit_amount: basePriceCents,
          currency: baseCurrency,
          metadata: {
            productSource: "paint-sip-depot-admin",
            variantSize: "STANDARD",
            productId,
            sku: defaultSku,
          },
        });
        defaultStripePriceId = stripePrice.id;
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name,
          normalizedName,
          sku: defaultSku,
          skuSequence,
          description,
          imageUrls,
          priceCents: basePriceCents,
          discountPercent,
          currency: baseCurrency,
          stripePriceId: defaultStripePriceId,
          status,
          archivedAt: status === PRODUCT_STATUS.archived ? new Date() : null,
          categoryId: input.categoryId,
          subcategoryId: subcategory?.id ?? null,
        },
      });

      const nextVariantIds = new Set(
        nextVariants
          .map((variant) => variant.id)
          .filter((value): value is string => Boolean(value)),
      );

      const nextColorOptionIds = new Set(
        preparedColorOptions
          .map((colorOption) => existingColorOptionsByLabel.get(colorOption.label.toLowerCase())?.id ?? null)
          .filter((value): value is string => Boolean(value)),
      );

      for (const existingVariant of existingProduct.variants) {
        if (!nextVariantIds.has(existingVariant.id) && !nextIsCanvas) {
          await tx.productVariant.delete({
            where: { id: existingVariant.id },
          });
        }
      }

      for (const variant of nextVariants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              sku: variant.sku,
              label: variant.label,
              widthInches: variant.widthInches,
              heightInches: variant.heightInches,
              priceCents: variant.priceCents,
              currency: variant.currency,
              stripePriceId: variant.stripePriceId,
              isDefault: variant.isDefault,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId,
              size: variant.size,
              sku: variant.sku,
              label: variant.label,
              widthInches: variant.widthInches,
              heightInches: variant.heightInches,
              priceCents: variant.priceCents,
              currency: variant.currency,
              stripePriceId: variant.stripePriceId,
              isDefault: variant.isDefault,
            },
          });
        }
      }

      for (const existingColorOption of existingProduct.colorOptions) {
        if (!nextColorOptionIds.has(existingColorOption.id)) {
          await tx.productColorOption.delete({
            where: { id: existingColorOption.id },
          });
        }
      }

      for (const colorOption of preparedColorOptions) {
        const existingColorOption =
          existingColorOptionsByLabel.get(colorOption.label.toLowerCase()) ?? null;

        if (existingColorOption) {
          await tx.productColorOption.update({
            where: { id: existingColorOption.id },
            data: {
              label: colorOption.label,
              hex: colorOption.hex,
              sortOrder: colorOption.sortOrder,
            },
          });
        } else {
          await tx.productColorOption.create({
            data: {
              productId,
              label: colorOption.label,
              hex: colorOption.hex,
              sortOrder: colorOption.sortOrder,
            },
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: productId },
        include: adminProductInclude,
      });
    });
  } catch (error) {
    if (error instanceof ProductServiceError) {
      throw error;
    }

    console.error("Product update error:", error);
    throw new ProductServiceError("Failed to update product.", 500);
  }
}

export async function setProductStatus(productId: string, nextStatus: ProductStatus) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      stripeProductId: true,
      status: true,
    },
  });

  if (!product) {
    throw new ProductServiceError("Product not found.", 404);
  }

  if (product.status === nextStatus) {
    return prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: adminProductInclude,
    });
  }

  if (!product.stripeProductId) {
    throw new ProductServiceError(
      "This product is missing its Stripe Product ID and cannot be archived safely.",
      409,
    );
  }

  try {
    const stripeClient = getStripeProductClient();
    await stripeClient.products.update(product.stripeProductId, {
      active: nextStatus === ProductStatus.ACTIVE,
    });

    return prisma.product.update({
      where: { id: productId },
      data: {
        status: nextStatus,
        archivedAt: nextStatus === ProductStatus.ARCHIVED ? new Date() : null,
      },
      include: adminProductInclude,
    });
  } catch (error) {
    console.error("Product status update error:", error);
    throw new ProductServiceError(
      nextStatus === ProductStatus.ARCHIVED
        ? "Failed to archive product."
        : "Failed to restore product.",
      500,
    );
  }
}

export function formatProductPriceRange(product: {
  priceCents: number;
  currency: string;
  variants: Array<{ priceCents: number; currency: string; size: ProductVariantSize }>;
}) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency.toUpperCase(),
  });

  const ordered = [...product.variants].sort((a, b) => a.priceCents - b.priceCents);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];

  if (!first || !last) {
    return formatter.format(product.priceCents / 100);
  }

  if (first.priceCents === last.priceCents) {
    return formatter.format(first.priceCents / 100);
  }

  return `${formatter.format(first.priceCents / 100)} - ${formatter.format(last.priceCents / 100)}`;
}

export function getDiscountCompareAtCents(priceCents: number, discountPercent: number | null | undefined) {
  const normalizedDiscount = normalizeDiscountPercent(discountPercent);
  if (!normalizedDiscount) {
    return null;
  }

  const denominator = 1 - normalizedDiscount / 100;
  if (denominator <= 0) {
    return null;
  }

  return Math.round(priceCents / denominator);
}

export function getPrimaryProductImage(product: { imageUrls: string[] }) {
  return product.imageUrls[0] ?? null;
}

export function shouldRenderCouplesImagePair(product: {
  subcategory: { slug: string } | null;
  imageUrls: string[];
}) {
  return product.imageUrls.length >= 2 && product.subcategory?.slug === COUPLES_SUBCATEGORY_SLUG;
}
