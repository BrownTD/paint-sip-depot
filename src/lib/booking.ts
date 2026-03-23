import { Prisma, type PrismaClient } from "@prisma/client";
import { sendExpiredCheckoutEmail } from "@/lib/email";
import { EVENT_TIME_ZONE, dateTimeInZoneToIso, getAbsoluteUrl } from "@/lib/utils";

// Stripe Checkout sessions cannot expire sooner than 30 minutes, so the
// reservation window matches that lower bound to keep inventory consistent.
export const RESERVATION_WINDOW_MINUTES = 30;
export const BOOKING_CUTOFF_DAYS = 7;
const BOOKING_STATUS = {
  pending: "PENDING",
  reserved: "RESERVED",
  paid: "PAID",
  expired: "EXPIRED",
} as const;
const BOOKING_EMAIL_TYPE = {
  expiredCheckout: "EXPIRED_CHECKOUT",
} as const;
const BOOKING_EMAIL_STATUS = {
  pending: "PENDING",
  sent: "SENT",
  failed: "FAILED",
} as const;
const EMAIL_PROVIDER = "resend";
type PrismaLike = {
  booking: PrismaClient["booking"];
  bookingEmailLog: {
    create: (...args: any[]) => Promise<any>;
    update: (...args: any[]) => Promise<any>;
  };
};
type ExpirableBookingStatus = typeof BOOKING_STATUS.pending | typeof BOOKING_STATUS.reserved;

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

export function formatTimeLeftUntilBookingCloses(
  startDateTime: Date,
  bookingCutoffOverrideAt?: Date | null,
  now: Date = new Date(),
) {
  const cutoffDate = getBookingCutoffDate(startDateTime, bookingCutoffOverrideAt);
  const remainingMs = cutoffDate.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return null;
  }

  const hoursLeft = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (hoursLeft < 24) {
    return `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}`;
  }

  const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
}

function getEventCheckoutRestartUrl(event: {
  slug: string;
  visibility: "PUBLIC" | "PRIVATE";
  eventCode: string | null;
}) {
  if (event.visibility === "PRIVATE" && event.eventCode) {
    return getAbsoluteUrl(`/e/${event.slug}?code=${encodeURIComponent(event.eventCode)}`);
  }

  return getAbsoluteUrl(`/e/${event.slug}`);
}

async function queueExpiredCheckoutEmail(
  prisma: PrismaLike,
  bookingId: string,
  now: Date,
  source: string,
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        purchaserName: true,
        purchaserEmail: true,
        event: {
          select: {
            title: true,
            slug: true,
            visibility: true,
            eventCode: true,
            startDateTime: true,
            bookingCutoffOverrideAt: true,
            locationName: true,
          },
        },
      },
    });

    if (!booking) {
      console.warn("Expired checkout email skipped: booking not found after expiration.", {
        bookingId,
        source,
      });
      return;
    }

    const timeLeftLabel = formatTimeLeftUntilBookingCloses(
      booking.event.startDateTime,
      booking.event.bookingCutoffOverrideAt,
      now,
    );

    if (!timeLeftLabel) {
      console.info("Expired checkout email skipped: booking cutoff already passed.", {
        bookingId,
        source,
      });
      return;
    }

    try {
      await prisma.bookingEmailLog.create({
        data: {
          bookingId,
          emailType: BOOKING_EMAIL_TYPE.expiredCheckout,
          status: BOOKING_EMAIL_STATUS.pending,
          recipientEmail: booking.purchaserEmail,
          provider: EMAIL_PROVIDER,
          attemptedAt: now,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.info("Expired checkout email skipped: duplicate email log exists.", {
          bookingId,
          source,
        });
        return;
      }

      throw error;
    }

    const eventUrl = getEventCheckoutRestartUrl(booking.event);

    try {
      const response = await sendExpiredCheckoutEmail({
        to: booking.purchaserEmail,
        purchaserName: booking.purchaserName,
        eventTitle: booking.event.title,
        eventUrl,
        startDateTime: booking.event.startDateTime,
        locationName: booking.event.locationName,
        timeLeftLabel,
      });

      if (response?.skipped) {
        throw new Error(`Email send skipped: ${response.reason}`);
      }

      await prisma.bookingEmailLog.update({
        where: {
          bookingId_emailType: {
            bookingId,
            emailType: BOOKING_EMAIL_TYPE.expiredCheckout,
          },
        },
        data: {
          status: BOOKING_EMAIL_STATUS.sent,
          providerMessageId: response?.id ?? null,
          sentAt: new Date(),
          failedAt: null,
          errorMessage: null,
        },
      });

      console.info("Expired checkout email sent.", {
        bookingId,
        source,
        recipientEmail: booking.purchaserEmail,
        providerMessageId: response?.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";

      await prisma.bookingEmailLog.update({
        where: {
          bookingId_emailType: {
            bookingId,
            emailType: BOOKING_EMAIL_TYPE.expiredCheckout,
          },
        },
        data: {
          status: BOOKING_EMAIL_STATUS.failed,
          failedAt: new Date(),
          errorMessage: message,
        },
      }).catch((logError: unknown) => {
        console.error("Expired checkout email failure could not be recorded.", {
          bookingId,
          source,
          error: logError instanceof Error ? logError.message : String(logError),
        });
      });

      console.error("Expired checkout email failed.", {
        bookingId,
        source,
        recipientEmail: booking.purchaserEmail,
        error: message,
      });
    }
  } catch (error) {
    console.error("Expired checkout email setup failed.", {
      bookingId,
      source,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function transitionBookingToExpired(
  prisma: PrismaLike,
  bookingId: string,
  previousStatus: ExpirableBookingStatus,
  now: Date,
  source: string,
) {
  const result = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: previousStatus,
    },
    data: { status: BOOKING_STATUS.expired },
  });

  if (result.count === 0) {
    return false;
  }

  if (previousStatus === BOOKING_STATUS.reserved) {
    await queueExpiredCheckoutEmail(prisma, bookingId, now, source);
  }

  return true;
}

export async function expireStaleReservations(
  prisma: PrismaLike,
  now: Date = new Date(),
  eventId?: string,
) {
  const staleBookings = await prisma.booking.findMany({
    where: {
      status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.reserved] },
      reservationExpiresAt: { lte: now },
      ...(eventId ? { eventId } : {}),
    },
    select: {
      id: true,
      status: true,
    },
  });

  for (const booking of staleBookings) {
    await transitionBookingToExpired(
      prisma,
      booking.id,
      booking.status as ExpirableBookingStatus,
      now,
      "stale_reservation_cleanup",
    );
  }
}

export async function expireBookingsForCheckoutSession(
  prisma: PrismaLike,
  checkoutSessionId: string,
  now: Date = new Date(),
) {
  const bookings = await prisma.booking.findMany({
    where: {
      stripeCheckoutSessionId: checkoutSessionId,
      status: { in: [BOOKING_STATUS.pending, BOOKING_STATUS.reserved] },
    },
    select: {
      id: true,
      status: true,
    },
  });

  for (const booking of bookings) {
    await transitionBookingToExpired(
      prisma,
      booking.id,
      booking.status as ExpirableBookingStatus,
      now,
      "stripe_checkout_session_expired",
    );
  }
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
