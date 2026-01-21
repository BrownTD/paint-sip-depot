import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  if (!input) return "";

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatTime(
  input: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  },
  locale: string = "en-US"
): string {
  if (!input) return "";

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(locale, options).format(d);
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

export function getAbsoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
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