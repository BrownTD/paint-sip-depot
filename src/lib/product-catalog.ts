export const PRODUCT_STATUS = {
  active: "ACTIVE",
  archived: "ARCHIVED",
} as const;

export const PRODUCT_VARIANT_SIZE = {
  medium: "MEDIUM",
  large: "LARGE",
} as const;

export const DEFAULT_PRODUCT_CURRENCY = "usd";
export const CANVAS_DEFAULT_DESCRIPTION =
  "Everything you need for a complete paint & sip experience, designed for everyone from beginners to pros. Whether you're hosting a group or painting solo, this all-in-one kit comes ready with everything you need-no prep required.\n\nEach kit includes:\n\n* Pre-drawn canvas (11x14 or 12x16)\n* Acrylic paint set\n* 3 paint brushes\n* Paint palette\n* Disposable apron\n* Tabletop easel\n* 9oz water cup\n\nJust open, set up, and start painting.";
export const CANVAS_DEFAULT_MEDIUM_PRICE = 35;
export const CANVAS_DEFAULT_LARGE_PRICE = 45;
export const PAINT_KITS_CATEGORY_NAME = "Paint Kits";
export const PAINT_KIT_BADGE_LABEL = "Paint Kit";

export const COUPLES_SUBCATEGORY_SLUG = "couples-date-night";
export const CANVASES_CATEGORY_ID = "cat_canvases";
export const PAINT_CATEGORY_ID = "cat_paint";

export const PRODUCT_VARIANT_DEFINITIONS = {
  MEDIUM: {
    size: PRODUCT_VARIANT_SIZE.medium,
    label: "Medium",
    widthInches: 11,
    heightInches: 14,
    isDefault: true,
  },
  LARGE: {
    size: PRODUCT_VARIANT_SIZE.large,
    label: "Large",
    widthInches: 12,
    heightInches: 16,
    isDefault: false,
  },
} as const;

export function normalizeCurrency(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizePlainText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeMultilineText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function normalizeProductName(value: string) {
  return sanitizePlainText(value).toLowerCase();
}

export function isCouplesSubcategory(slug: string | null | undefined) {
  return slug === COUPLES_SUBCATEGORY_SLUG;
}

export function getCategorySkuCode(categoryId: string) {
  if (categoryId === CANVASES_CATEGORY_ID) {
    return "KIT";
  }

  return categoryId
    .replace(/^cat_/i, "")
    .replace(/[^a-z]/gi, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

export function getCategoryDisplayName(categoryId: string, fallbackName: string) {
  if (categoryId === CANVASES_CATEGORY_ID) {
    return PAINT_KITS_CATEGORY_NAME;
  }

  return fallbackName;
}

export function getCategoryBadgeLabel(categoryId: string, fallbackName: string) {
  if (categoryId === CANVASES_CATEGORY_ID) {
    return PAINT_KIT_BADGE_LABEL;
  }

  return fallbackName;
}

export function getVariantSkuCode(
  variantSize: typeof PRODUCT_VARIANT_SIZE[keyof typeof PRODUCT_VARIANT_SIZE] | "STANDARD",
) {
  if (variantSize === PRODUCT_VARIANT_SIZE.medium) return "MED";
  if (variantSize === PRODUCT_VARIANT_SIZE.large) return "LRG";
  return "STD";
}

export function formatSkuSequence(sequence: number) {
  return String(sequence).padStart(3, "0");
}

export function sanitizeColorHex(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return normalized;
  }

  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}
