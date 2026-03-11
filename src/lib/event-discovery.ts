import { prisma } from "@/lib/prisma";

const discoveryEventSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  canvasImageUrl: true,
  locationName: true,
  city: true,
  state: true,
  eventFormat: true,
  visibility: true,
  ticketPriceCents: true,
  startDateTime: true,
  host: { select: { name: true } },
  canvas: { select: { name: true } },
  _count: { select: { bookings: { where: { status: "PAID" } } } },
} as const;

export const EVENT_CODE_PREFIX = "PSD";

export type DiscoveryFilters = {
  query?: string;
  format?: "ALL" | "IN_PERSON" | "VIRTUAL";
  when?: "ALL" | "THIS_WEEK";
  limit?: number;
};

export async function generateUniqueEventCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${EVENT_CODE_PREFIX}-${Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(2, 7)}`;

    const existing = await prisma.event.findFirst({
      where: { eventCode: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique event code");
}

export function normalizeEventCode(input: string) {
  return input.trim().toUpperCase();
}

export function buildDiscoveryWhere(filters: DiscoveryFilters = {}) {
  const now = new Date();
  const format = filters.format && filters.format !== "ALL" ? filters.format : undefined;
  const q = filters.query?.trim();

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    visibility: "PUBLIC",
    startDateTime: { gt: now },
  };

  if (format) {
    where.eventFormat = format;
  }

  if (filters.when === "THIS_WEEK") {
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    where.startDateTime = { gt: now, lte: nextWeek };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { locationName: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { host: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function getDiscoverableEvents(filters: DiscoveryFilters = {}) {
  return prisma.event.findMany({
    where: buildDiscoveryWhere(filters),
    select: discoveryEventSelect,
    orderBy: { startDateTime: "asc" },
    take: filters.limit,
  });
}

export async function findEventByCode(code: string) {
  return prisma.event.findFirst({
    where: { eventCode: normalizeEventCode(code) },
    select: {
      id: true,
      slug: true,
      status: true,
      visibility: true,
      startDateTime: true,
      eventCode: true,
    },
  });
}

export async function resolveEventCodeForVisibility(
  visibility: "PUBLIC" | "PRIVATE",
  currentCode?: string | null
) {
  if (visibility === "PRIVATE") {
    return currentCode || generateUniqueEventCode();
  }

  return null;
}

export function isLiveEvent(startDateTime: Date, status: string) {
  return status === "PUBLISHED" && startDateTime > new Date();
}
