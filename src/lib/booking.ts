import type { PrismaClient, Prisma } from "@prisma/client";
import { EVENT_TIME_ZONE, dateTimeInZoneToIso } from "@/lib/utils";

// Stripe Checkout sessions cannot expire sooner than 30 minutes, so the
// reservation window matches that lower bound to keep inventory consistent.
export const RESERVATION_WINDOW_MINUTES = 30;
export const BOOKING_CUTOFF_DAYS = 7;

type PrismaLike = PrismaClient | Prisma.TransactionClient;
const BOOKING_STATUS = {
  pending: "PENDING",
  reserved: "RESERVED",
  paid: "PAID",
  expired: "EXPIRED",
} as const;

export function getReservationExpiry(now: Date = new Date()) {
  return new Date(now.getTime() + RESERVATION_WINDOW_MINUTES * 60 * 1000);
}

function getDatePartsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value;

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
  };
}

function toDateInputValue(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

export function getBookingCutoffDate(
  startDateTime: Date,
  bookingCutoffOverrideAt?: Date | null
) {
  if (bookingCutoffOverrideAt) {
    return new Date(bookingCutoffOverrideAt);
  }

  const { year, month, day } = getDatePartsInZone(startDateTime, EVENT_TIME_ZONE);
  const cutoffDateUtc = new Date(Date.UTC(year, month - 1, day - BOOKING_CUTOFF_DAYS));

  return new Date(
    dateTimeInZoneToIso(
      toDateInputValue(
        cutoffDateUtc.getUTCFullYear(),
        cutoffDateUtc.getUTCMonth() + 1,
        cutoffDateUtc.getUTCDate()
      ),
      "23:59",
      EVENT_TIME_ZONE
    )
  );
}

export function areBookingsClosed(
  startDateTime: Date,
  now: Date = new Date(),
  bookingCutoffOverrideAt?: Date | null
) {
  return now >= getBookingCutoffDate(startDateTime, bookingCutoffOverrideAt);
}

export async function expireStaleReservations(
  prisma: PrismaLike,
  now: Date = new Date(),
  eventId?: string,
) {
  await prisma.booking.updateMany({
    where: {
      status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.reserved] },
      reservationExpiresAt: { lte: now },
      ...(eventId ? { eventId } : {}),
    },
    data: { status: BOOKING_STATUS.expired },
  });
}

export async function getReservedTicketQuantity(
  prisma: PrismaLike,
  eventId: string,
  now: Date = new Date(),
) {
  const reserved = await prisma.booking.aggregate({
    where: {
      eventId,
      status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.reserved] },
      reservationExpiresAt: { gt: now },
    },
    _sum: { quantity: true },
  });

  return reserved._sum?.quantity ?? 0;
}

export async function getPaidTicketQuantity(prisma: PrismaLike, eventId: string) {
  const paid = await prisma.booking.aggregate({
    where: { eventId, status: BOOKING_STATUS.paid },
    _sum: { quantity: true },
  });

  return paid._sum?.quantity ?? 0;
}

export async function getPaidTicketQuantitiesForEvents(
  prisma: PrismaLike,
  eventIds: string[],
) {
  if (eventIds.length === 0) {
    return new Map<string, number>();
  }

  const grouped = await prisma.booking.groupBy({
    by: ["eventId"],
    where: {
      eventId: { in: eventIds },
      status: BOOKING_STATUS.paid,
    },
    _sum: { quantity: true },
  });

  return new Map(grouped.map((row) => [row.eventId, row._sum.quantity ?? 0]));
}

export async function getRemainingTickets(
  prisma: PrismaLike,
  eventId: string,
  capacity: number,
  now: Date = new Date(),
) {
  const [paid, reserved] = await Promise.all([
    getPaidTicketQuantity(prisma, eventId),
    getReservedTicketQuantity(prisma, eventId, now),
  ]);

  return {
    paid,
    reserved,
    remaining: Math.max(capacity - paid - reserved, 0),
  };
}
