import type { PrismaClient, Prisma } from "@prisma/client";

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

export function getBookingCutoffDate(startDateTime: Date) {
  return new Date(startDateTime.getTime() - BOOKING_CUTOFF_DAYS * 24 * 60 * 60 * 1000);
}

export function areBookingsClosed(startDateTime: Date, now: Date = new Date()) {
  return now >= getBookingCutoffDate(startDateTime);
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
