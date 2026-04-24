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

export const PAINT_COLOR_CATEGORIES = [
  {
    name: "Neutrals",
    colors: [
      { label: "White", hex: "#FFFFFF" },
      { label: "Black", hex: "#1C1C1C" },
      { label: "Pewter Gray", hex: "#8A8A8A" },
      { label: "Country Gray", hex: "#A9A9A9" },
    ],
  },
  {
    name: "Reds",
    colors: [
      { label: "Bright Red", hex: "#FF0000" },
      { label: "True Red", hex: "#E10600" },
      { label: "Brick Red", hex: "#8B2500" },
      { label: "Burgundy", hex: "#800020" },
      { label: "Barn Red", hex: "#7C0A02" },
      { label: "Red", hex: "#D00000" },
    ],
  },
  {
    name: "Oranges",
    colors: [
      { label: "Bright Orange", hex: "#FF7F00" },
      { label: "Pumpkin", hex: "#FF7518" },
      { label: "Coral", hex: "#FF7F50" },
      { label: "Tangerine", hex: "#F28500" },
    ],
  },
  {
    name: "Yellows",
    colors: [
      { label: "Bright Yellow", hex: "#FFFF00" },
      { label: "Yellow", hex: "#FFD700" },
      { label: "Lemon Yellow", hex: "#FFF44F" },
      { label: "Mustard", hex: "#E1AD01" },
      { label: "Yellow Ochre", hex: "#C99700" },
    ],
  },
  {
    name: "Greens",
    colors: [
      { label: "Bright Green", hex: "#00FF00" },
      { label: "Kelly Green", hex: "#4CBB17" },
      { label: "Lime Green", hex: "#32CD32" },
      { label: "Sap Green", hex: "#507D2A" },
      { label: "Moss Green", hex: "#8A9A5B" },
      { label: "Hunter Green", hex: "#355E3B" },
      { label: "Light Green", hex: "#90EE90" },
    ],
  },
  {
    name: "Blues",
    colors: [
      { label: "Bright Blue", hex: "#0000FF" },
      { label: "Dark Blue", hex: "#00008B" },
      { label: "Navy Blue", hex: "#000080" },
      { label: "Sky Blue", hex: "#87CEEB" },
      { label: "Baby Blue", hex: "#89CFF0" },
      { label: "Bahama Blue", hex: "#1E90FF" },
      { label: "Aqua", hex: "#00FFFF" },
      { label: "Teal", hex: "#008080" },
    ],
  },
  {
    name: "Purples",
    colors: [
      { label: "Purple", hex: "#800080" },
      { label: "Bright Purple", hex: "#BF00FF" },
      { label: "Lavender", hex: "#E6E6FA" },
      { label: "Grape", hex: "#6F2DA8" },
    ],
  },
  {
    name: "Browns / Earth Tones",
    colors: [
      { label: "Brown", hex: "#8B4513" },
      { label: "Nutmeg Brown", hex: "#8B4513" },
      { label: "Chocolate", hex: "#5D3A1A" },
      { label: "Golden Brown", hex: "#996515" },
      { label: "Sandstone", hex: "#D2B48C" },
      { label: "Beige", hex: "#F5F5DC" },
      { label: "Tan", hex: "#D2B48C" },
      { label: "Khaki", hex: "#C3B091" },
    ],
  },
  {
    name: "Off-Whites",
    colors: [
      { label: "Antique White", hex: "#FAEBD7" },
      { label: "Ivory", hex: "#FFFFF0" },
      { label: "Cream", hex: "#FFFDD0" },
    ],
  },
  {
    name: "Metallic",
    colors: [
      { label: "Gold", hex: "#D4AF37" },
      { label: "Silver", hex: "#C0C0C0" },
      { label: "Copper", hex: "#B87333" },
    ],
  },
] as const;

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
