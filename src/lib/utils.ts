import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function isSalesCutoffPassed(eventDate: Date | string, cutoffHours: number): boolean {
  const eventTime = new Date(eventDate).getTime();
  const cutoffTime = eventTime - cutoffHours * 60 * 60 * 1000;
  return Date.now() >= cutoffTime;
}

export function getCutoffDate(eventDate: Date | string, cutoffHours: number): Date {
  const eventTime = new Date(eventDate).getTime();
  return new Date(eventTime - cutoffHours * 60 * 60 * 1000);
}

export function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}${path}`;
}