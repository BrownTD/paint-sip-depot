import { z } from "zod";

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
  locationName: z.string().min(2, "Location name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  ticketPriceCents: z.coerce.number().int().min(0).max(100000),
  capacity: z.coerce.number().int().min(1).max(1000),
  salesCutoffHours: z.coerce.number().int().min(0).max(168).default(48),
  refundPolicyText: z.string().max(1000).optional(),
  canvasImageUrl: z.string().url().optional().or(z.literal("")),
  canvasId: z.string().optional(),
});

export const bookingSchema = z.object({
  eventId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(10),
  purchaserName: z.string().min(2, "Name is required"),
  purchaserEmail: z.string().email("Valid email required"),
});

export const canvasImportSchema = z.array(
  z.object({
    name: z.string().min(1),
    imageUrl: z.string().url(),
    tags: z.array(z.string()).default([]),
  })
);

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type CanvasImportInput = z.infer<typeof canvasImportSchema>;