import { z } from "zod";

const canvasImageUrlSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/canvas-options\/.+/, "Canvas image must come from canvas-options"),
  z.literal(""),
]);

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  quantity: z.coerce.number().int().min(1).max(10),
  purchaserName: z.string().min(2, "Name is required"),
  purchaserEmail: z.string().email("Valid email required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
