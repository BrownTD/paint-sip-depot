import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export const EVENT_TIME_ZONE = "America/New_York";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toValidDate(input: Date | string | number | null | undefined) {
  if (!input) return null;

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  return d;
}

export function formatDate(
  input: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
  locale: string = "en-US"
): string {
  const d = toValidDate(input);
  if (!d) return "";

  return new Intl.DateTimeFormat(locale, { ...options, timeZone: EVENT_TIME_ZONE }).format(d);
}

export function formatTime(
  input: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  },
  locale: string = "en-US"
): string {
  const d = toValidDate(input);
  if (!d) return "";

  return new Intl.DateTimeFormat(locale, { ...options, timeZone: EVENT_TIME_ZONE }).format(d);
}

export function formatDateInputValue(input: Date | string | number | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
}

export function formatTimeInputValue(input: Date | string | number | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  return hour && minute ? `${hour}:${minute}` : "";
}

export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // remove apostrophes
    .replace(/['’]/g, "")
    // replace non-alphanumeric with dashes
    .replace(/[^a-z0-9]+/g, "-")
    // collapse multiple dashes
    .replace(/-+/g, "-")
    // trim dashes from ends
    .replace(/^-|-$/g, "");
}

export function generateRandomSlug(prefix: string = "evt"): string {
  return `${prefix}-${randomBytes(4).toString("hex")}`;
}

export function getAbsoluteUrl(path: string): string {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
    : undefined;

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    vercelUrl ||
    (process.env.NODE_ENV === "production" ? "https://paint-sip-depot.vercel.app" : undefined) ||
    "http://localhost:3000";

  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

export function getCutoffDate(startDateTime: Date, salesCutoffHours: number): Date {
  const cutoff = new Date(startDateTime);
  cutoff.setHours(cutoff.getHours() - salesCutoffHours);
  return cutoff;
}

export function isSalesCutoffPassed(startDateTime: Date, salesCutoffHours: number): boolean {
  const cutoff = getCutoffDate(startDateTime, salesCutoffHours);
  return new Date() >= cutoff;
}
