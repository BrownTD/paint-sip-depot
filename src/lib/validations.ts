import { z } from "zod";
import {
  CANVASES_CATEGORY_ID,
  DEFAULT_PRODUCT_CURRENCY,
  PAINT_CATEGORY_ID,
  PRODUCT_VARIANT_SIZE,
  normalizeCurrency,
  sanitizeColorHex,
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/product-catalog";

const canvasImageUrlSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/canvas-options\/.+/, "Canvas image must come from canvas-options"),
  z.literal(""),
]);

const productImageUrlSchema = z.union([
  z.string().url("Product images must be valid URLs"),
  z.string().regex(/^\/(?!\/).+/, "Product images must be valid URLs"),
]);
const reviewImageUrlSchema = z.string().url("Review image must be a valid URL");

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  recaptchaToken: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(2000).optional(),
  startDateTime: z.coerce.date().refine((date) => date > new Date(), {
    message: "Event must be in the future",
  }),
  endDateTime: z.coerce.date().optional(),
  eventFormat: z.enum(["IN_PERSON", "VIRTUAL"]).default("IN_PERSON"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  locationName: z.string().min(2, "Location name is required"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  shippingRecipientName: z.string().min(2, "Shipping recipient name is required"),
  shippingAddress: z.string().min(5, "Shipping street address is required"),
  shippingCity: z.string().min(2, "Shipping city is required"),
  shippingState: z.string().length(2, "Use 2-letter state code"),
  shippingZip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid shipping ZIP code"),
  fulfillmentMethod: z.enum(["SHIP_TO_HOST", "PICKUP"]).default("SHIP_TO_HOST"),
  ticketPriceCents: z.coerce.number().int().min(0).max(100000),
  capacity: z.coerce.number().int().min(1).max(1000),
  salesCutoffHours: z.coerce.number().int().min(0).max(168).default(48),
  refundPolicyText: z.string().max(1000).optional(),
  canvasImageUrl: canvasImageUrlSchema.optional(),
  canvasName: z.string().max(120).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.endDateTime && data.endDateTime <= data.startDateTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDateTime"],
      message: "End time must be after the start time",
    });
  }

  if (data.eventFormat === "IN_PERSON") {
    if (!data.address || data.address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Address is required for in-person events",
      });
    }
    if (!data.city || data.city.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "City is required for in-person events",
      });
    }
    if (!data.state || data.state.trim().length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "Use 2-letter state code",
      });
    }
    if (!data.zip || !/^\d{5}(-\d{4})?$/.test(data.zip)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zip"],
        message: "Invalid ZIP code",
      });
    }
  }
});

export const bookingSchema = z.object({
  eventId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1),
  purchaserName: z.string().min(2, "Name is required"),
  purchaserEmail: z.string().email("Valid email required"),
});

export const productVariantInputSchema = z.object({
  size: z.enum([PRODUCT_VARIANT_SIZE.medium, PRODUCT_VARIANT_SIZE.large]),
  price: z.coerce.number().gt(0, "Price must be greater than 0"),
  currency: z
    .string()
    .trim()
    .min(1, "Currency is required")
    .transform((value) => normalizeCurrency(value))
    .refine((value) => value.length === 3, "Use a 3-letter currency code"),
});

export const productColorOptionInputSchema = z.object({
  label: z
    .string()
    .transform((value) => sanitizePlainText(value))
    .refine((value) => value.length > 0, "Color name is required")
    .refine((value) => value.length <= 40, "Color name must be 40 characters or less"),
  hex: z
    .string()
    .transform((value) => sanitizeColorHex(value))
    .refine((value) => /^#[0-9A-F]{6}$/i.test(value), "Use a valid 6-digit hex color"),
});

export const productSchema = z
  .object({
    name: z
      .string()
      .transform((value) => sanitizePlainText(value))
      .refine((value) => value.length > 0, "Name is required")
      .refine((value) => value.length <= 120, "Name must be 120 characters or less"),
    description: z
      .string()
      .transform((value) => sanitizeMultilineText(value))
      .refine((value) => value.length > 0, "Description is required")
      .refine((value) => value.length <= 3000, "Description must be 3000 characters or less"),
    currency: z
      .string()
      .trim()
      .min(1, "Currency is required")
      .transform((value) => normalizeCurrency(value))
      .refine((value) => value.length === 3, "Use a 3-letter currency code"),
    categoryId: z.string().trim().min(1, "Category is required"),
    subcategoryId: z.string().trim().min(1).optional().nullable(),
    imageUrls: z.array(productImageUrlSchema).min(1, "At least one product image is required").max(8),
    status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
    basePrice: z.coerce.number().gt(0, "Price must be greater than 0"),
    discountPercent: z.coerce.number().int().min(1, "Discount must be at least 1%").max(95, "Discount must be 95% or less").optional().nullable(),
    colorOptions: z.array(productColorOptionInputSchema).max(12, "Use 12 colors or fewer").default([]),
    variants: z.array(productVariantInputSchema).max(2, "Only medium and large variants are supported right now").default([]),
  })
  .superRefine((data, ctx) => {
    const isCanvasCategory = data.categoryId === CANVASES_CATEGORY_ID;
    const isPaintCategory = data.categoryId === PAINT_CATEGORY_ID;

    if (isCanvasCategory) {
      const sizes = new Set(data.variants.map((variant) => variant.size));
      if (!sizes.has(PRODUCT_VARIANT_SIZE.medium) || !sizes.has(PRODUCT_VARIANT_SIZE.large)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "Medium and large variants are required for paint kit products",
        });
      }
    }

    const currencies = new Set(data.variants.map((variant) => variant.currency));
    if (currencies.size > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "All variants must use the same currency",
      });
    }

    if (!isCanvasCategory && data.variants.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "Only paint kit products use medium and large variants right now",
      });
    }

    const normalizedColorLabels = new Set<string>();
    for (const colorOption of data.colorOptions) {
      const normalizedLabel = colorOption.label.toLowerCase();
      if (normalizedColorLabels.has(normalizedLabel)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["colorOptions"],
          message: "Color names must be unique",
        });
        break;
      }
      normalizedColorLabels.add(normalizedLabel);
    }

    if (!isCanvasCategory && !isPaintCategory && data.colorOptions.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["colorOptions"],
        message: "Paint colors are currently supported for paint kits and paint products only",
      });
    }
  });

export const shopCheckoutSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  colorOptionId: z.string().cuid().optional().nullable(),
  quantity: z.coerce.number().int().min(1),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  shippingName: z.string().min(2, "Shipping name is required"),
  shippingAddress: z.string().min(3, "Shipping address is required"),
  shippingCity: z.string().min(2, "Shipping city is required"),
  shippingState: z.string().trim().length(2, "Use the 2-letter shipping state"),
  shippingZip: z.string().min(5, "Shipping ZIP code is required"),
  shippingPhone: z.string().min(7, "Shipping phone is required"),
});

export const shopCartCheckoutItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  colorOptionId: z.string().cuid().optional().nullable(),
  quantity: z.coerce.number().int().min(1),
});

export const shopCartCheckoutSchema = z.object({
  items: z.array(shopCartCheckoutItemSchema).min(1, "Add at least one item to the cart"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  shippingName: z.string().min(2, "Shipping name is required"),
  shippingAddress: z.string().min(3, "Shipping address is required"),
  shippingCity: z.string().min(2, "Shipping city is required"),
  shippingState: z.string().trim().length(2, "Use the 2-letter shipping state"),
  shippingZip: z.string().min(5, "Shipping ZIP code is required"),
  shippingPhone: z.string().min(7, "Shipping phone is required"),
});

export const productReviewSchema = z.object({
  reviewerName: z.string().trim().min(2, "Name is required").max(80, "Name must be 80 characters or less"),
  reviewerEmail: z.string().email("Valid email required"),
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5, "Rating must be between 1 and 5"),
  body: z.string().trim().min(1, "Review is required").max(250, "Review must be 250 characters or less"),
  imageUrl: reviewImageUrlSchema.optional().nullable(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ShopCheckoutInput = z.infer<typeof shopCheckoutSchema>;
export type ShopCartCheckoutInput = z.infer<typeof shopCartCheckoutSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductColorOptionInput = z.infer<typeof productColorOptionInputSchema>;
export type ProductReviewInput = z.infer<typeof productReviewSchema>;
