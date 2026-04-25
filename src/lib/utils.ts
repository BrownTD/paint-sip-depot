import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export const EVENT_TIME_ZONE = "America/New_York";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value;

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
  };
}

export function dateTimeInZoneToIso(
  dateInput: string,
  timeInput: string,
  timeZone: string = EVENT_TIME_ZONE
) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeInput);

  if (!dateMatch || !timeMatch) {
    throw new Error("Invalid date or time format.");
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = new Date(utcGuess);
  const firstParts = getTimeZoneParts(firstPass, timeZone);
  const firstPassUtc = Date.UTC(
    firstParts.year,
    firstParts.month - 1,
    firstParts.day,
    firstParts.hour,
    firstParts.minute
  );
  const adjusted = new Date(utcGuess - (firstPassUtc - utcGuess));
  const adjustedParts = getTimeZoneParts(adjusted, timeZone);

  if (
    adjustedParts.year !== year ||
    adjustedParts.month !== month ||
    adjustedParts.day !== day ||
    adjustedParts.hour !== hour ||
    adjustedParts.minute !== minute
  ) {
    throw new Error("Selected time is invalid for America/New_York.");
  }

  return adjusted.toISOString();
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
    (process.env.NODE_ENV === "production" ? "https://www.paintsipdepot.com" : undefined) ||
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
