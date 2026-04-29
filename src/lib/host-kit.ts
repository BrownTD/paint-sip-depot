import { BookingStatus, EventStatus } from "@prisma/client";
import { areBookingsClosed, getBookingCutoffDate } from "@/lib/booking";
import { sendHostKitReminderEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getAbsoluteUrl, normalizeEmail } from "@/lib/utils";

export const HOST_KIT_REMINDER_TYPES = {
  threeDays: "THREE_DAYS_BEFORE_CUTOFF",
  oneDay: "ONE_DAY_BEFORE_CUTOFF",
} as const;

export type HostKitBannerEvent = {
  id: string;
  title: string;
  slug: string;
  startDateTime: Date;
  cutoffDate: Date;
};

export async function hasHostPurchasedEventKit(eventId: string, hostEmail: string | null | undefined) {
  if (!hostEmail) return true;

  const booking = await prisma.booking.findFirst({
    where: {
      eventId,
      status: BookingStatus.PAID,
      purchaserEmail: {
        equals: normalizeEmail(hostEmail),
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  return Boolean(booking);
}

export async function getHostKitBannerEvent(hostId: string, hostEmail: string | null | undefined) {
  if (!hostEmail) return null;

  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      hostId,
      status: EventStatus.PUBLISHED,
      startDateTime: { gt: now },
    },
    orderBy: { startDateTime: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      startDateTime: true,
      bookingCutoffOverrideAt: true,
    },
  });

  for (const event of events) {
    if (areBookingsClosed(event.startDateTime, now, event.bookingCutoffOverrideAt)) continue;
    if (await hasHostPurchasedEventKit(event.id, hostEmail)) continue;

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      startDateTime: event.startDateTime,
      cutoffDate: getBookingCutoffDate(event.startDateTime, event.bookingCutoffOverrideAt),
    } satisfies HostKitBannerEvent;
  }

  return null;
}

export async function sendDueHostKitReminderEmails(now = new Date()) {
  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      startDateTime: { gt: now },
    },
    select: {
      id: true,
      title: true,
      startDateTime: true,
      bookingCutoffOverrideAt: true,
      host: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  const results: Array<{ eventId: string; reminderType: string; sent: boolean; reason?: string }> = [];

  for (const event of events) {
    const hostEmail = event.host.email;
    if (!hostEmail) continue;

    const cutoffDate = getBookingCutoffDate(event.startDateTime, event.bookingCutoffOverrideAt);
    const remainingMs = cutoffDate.getTime() - now.getTime();
    if (remainingMs <= 0) continue;

    const remainingHours = remainingMs / (60 * 60 * 1000);
    const reminder =
      remainingHours <= 24
        ? { type: HOST_KIT_REMINDER_TYPES.oneDay, days: 1 as const }
        : remainingHours <= 72
          ? { type: HOST_KIT_REMINDER_TYPES.threeDays, days: 3 as const }
          : null;

    if (!reminder) continue;

    const normalizedEmail = normalizeEmail(hostEmail);
    if (await hasHostPurchasedEventKit(event.id, normalizedEmail)) {
      results.push({ eventId: event.id, reminderType: reminder.type, sent: false, reason: "already_purchased" });
      continue;
    }

    const existing = await prisma.eventHostKitReminder.findUnique({
      where: {
        eventId_reminderType_recipientEmail: {
          eventId: event.id,
          reminderType: reminder.type,
          recipientEmail: normalizedEmail,
        },
      },
      select: { id: true },
    });
    if (existing) {
      results.push({ eventId: event.id, reminderType: reminder.type, sent: false, reason: "already_sent" });
      continue;
    }

    await sendHostKitReminderEmail({
      to: normalizedEmail,
      recipientName: event.host.name,
      eventTitle: event.title,
      eventUrl: getAbsoluteUrl("/dashboard"),
      dashboardUrl: getAbsoluteUrl("/dashboard"),
      cutoffDate,
      daysBeforeCutoff: reminder.days,
    });
    await prisma.eventHostKitReminder.create({
      data: {
        eventId: event.id,
        reminderType: reminder.type,
        recipientEmail: normalizedEmail,
      },
    });
    results.push({ eventId: event.id, reminderType: reminder.type, sent: true });
  }

  return results;
}
