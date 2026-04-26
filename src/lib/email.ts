import { formatDate, formatTime, getAbsoluteUrl } from "@/lib/utils";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";
const DEFAULT_ADMIN_EMAIL = "info@paintsipdepot.com";
const DEFAULT_REPLY_TO_EMAIL = "info@paintsipdepot.com";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | string[];
  from?: string;
};

type EventCreatedEmailInput = {
  recipientName?: string | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
  eventTitle: string;
  eventUrl: string;
  previewUrl?: string | null;
  startDateTime: Date;
  endDateTime?: Date | null;
  locationName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  eventFormat?: "IN_PERSON" | "VIRTUAL";
  visibility: "PUBLIC" | "PRIVATE";
  eventCode?: string | null;
  capacity?: number;
  ticketPriceCents?: number;
  status?: "DRAFT" | "PUBLISHED" | "ENDED" | "CANCELED";
};

type EventUpdateChange = {
  label: string;
  previousValue: string;
  nextValue: string;
};

type EventUpdatedEmailInput = {
  to: string | string[];
  recipientName?: string | null;
  audience: "admin" | "host" | "guest";
  eventTitle: string;
  eventUrl: string;
  previewUrl?: string | null;
  startDateTime: Date;
  locationName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  changes: EventUpdateChange[];
};

type VerificationEmailInput = {
  to: string;
  recipientName?: string | null;
  code: string;
  expires: Date;
};

type PasswordResetEmailInput = {
  to: string;
  recipientName?: string | null;
  resetUrl: string;
  expires: Date;
};

type OrderNotificationInput = {
  recipientName?: string | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
  bookingId?: string | null;
  purchasedAt?: Date | null;
  eventTitle: string;
  eventUrl: string;
  previewUrl?: string | null;
  startDateTime: Date;
  locationName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  visibility?: "PUBLIC" | "PRIVATE";
  eventCode?: string | null;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
  amountPaidCents: number;
  shippingAmountCents?: number | null;
  shippingProvider?: string | null;
  shippingService?: string | null;
  trackingNumber?: string | null;
  trackingStatus?: string | null;
  trackingUrl?: string | null;
};

type ExpiredCheckoutEmailInput = {
  to: string;
  purchaserName?: string | null;
  eventTitle: string;
  eventUrl: string;
  startDateTime: Date;
  locationName: string;
  timeLeftLabel: string;
};

type ShopExpiredCheckoutEmailInput = {
  to: string;
  customerName?: string | null;
  orderId: string;
  shopUrl: string;
  items: Array<{
    productName: string;
    variantLabel?: string | null;
    quantity: number;
  }>;
};

type ShopOrderConfirmationEmailInput = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amountSubtotalCents: number;
  amountTotalCents: number;
  shippingAmountCents: number;
  shippingProvider?: string | null;
  shippingService?: string | null;
  trackingNumber?: string | null;
  trackingStatus?: string | null;
  trackingUrl?: string | null;
  currency: string;
  orderUrl: string;
  items: Array<{
    productName: string;
    variantLabel?: string | null;
    colorLabel?: string | null;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
  }>;
};

type ReturnSubmissionEmailInput = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber?: string | null;
  issueType: string;
  description: string;
  photoUrls: string[];
  didNotReceiveOrder?: boolean;
  adminUrl: string;
};

function getResendApiKey() {
  return process.env.RESEND_API_KEY;
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

function getTicketsFromEmail() {
  return process.env.RESEND_TICKETS_FROM_EMAIL || getFromEmail();
}

function getEventsFromEmail() {
  return process.env.RESEND_EVENTS_FROM_EMAIL || getFromEmail();
}

function getAccountFromEmail() {
  return process.env.RESEND_ACCOUNT_FROM_EMAIL || getFromEmail();
}

function getReturnsFromEmail() {
  return process.env.RESEND_RETURNS_FROM_EMAIL || getFromEmail();
}

function getOrdersFromEmail() {
  return process.env.RESEND_ORDERS_FROM_EMAIL || getFromEmail();
}

function getAdminEmail() {
  return process.env.ORDER_ALERT_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
}

function getReplyToEmail() {
  return process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO_EMAIL;
}

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatEventFormatLabel(eventFormat: "IN_PERSON" | "VIRTUAL") {
  return eventFormat === "VIRTUAL" ? "Virtual" : "In Person";
}

function formatEventStatusLabel(status: "DRAFT" | "PUBLISHED" | "ENDED" | "CANCELED") {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatAddressLine({
  address,
  city,
  state,
  zip,
}: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}) {
  const parts = [address?.trim(), [city?.trim(), state?.trim()].filter(Boolean).join(", "), zip?.trim()]
    .filter(Boolean);

  return parts.join(", ");
}

function emailShell(title: string, eyebrow: string, bodyHtml: string) {
  const logoUrl = "https://www.paintsipdepot.com/Misc/psd_logo.png";

  return `
    <div style="margin:0;padding:24px;background:#ffffff;font-family:Arial,sans-serif;color:#111111;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #1f1f1f;">
        <div style="padding:28px 32px;background:#000000;border-bottom:4px solid #feaa08;">
          <img src="${logoUrl}" alt="Paint & Sip Depot" style="height:42px;width:auto;display:block;margin-bottom:14px;" />
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#feaa08;font-weight:700;">${eyebrow}</div>
          <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">${title}</h1>
        </div>
        <div style="padding:32px;">
          ${bodyHtml}
        </div>
      </div>
    </div>
  `;
}

function signatureBlock() {
  return `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;font-size:14px;line-height:1.7;color:#525252;">
      <p style="margin:0 0 14px;font-weight:700;color:#111111;">Paint &amp; Sip Depot</p>
      <p style="margin:0;">Creating unforgettable paint &amp; sip experiences</p>
      <p style="margin:14px 0 0;">
        <a href="tel:+18039384775" style="color:#111111;text-decoration:none;">(803) 938-4775</a><br />
        <a href="mailto:info@paintsipdepot.com" style="color:#111111;text-decoration:none;">info@paintsipdepot.com</a><br />
        <a href="https://www.paintsipdepot.com" style="color:#111111;text-decoration:none;">www.paintsipdepot.com</a>
      </p>
    </div>
  `;
}

function getFirstName(name?: string | null) {
  const trimmedName = name?.trim();
  if (!trimmedName) return "there";

  return trimmedName.split(/\s+/)[0] || "there";
}

async function sendEmail(
  { to, subject, html, text, replyTo, from }: SendEmailOptions,
  options?: { enabled?: boolean }
) {
  const fromEmail = from || getFromEmail();

  if (options?.enabled === false) {
    console.info("Email delivery disabled.", {
      to,
      subject,
      from: fromEmail,
      replyTo,
    });
    return { skipped: true as const, reason: "disabled" as const };
  }

  console.info("Email delivery attempt.", {
    disabled: false,
    to,
    subject,
    from: fromEmail,
    replyTo,
  });

  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing; skipping email send.");
    return { skipped: true as const, reason: "missing_api_key" as const };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Resend email failed (${response.status}): ${errorBody}`);
  }

  const responseBody = await response.json().catch(() => null);
  return {
    id: responseBody?.id as string | undefined,
    skipped: false as const,
  };
}

export async function sendAdminEventCreatedEmail(input: EventCreatedEmailInput) {
  const organizerLine = [input.organizerName?.trim(), input.organizerEmail?.trim()]
    .filter(Boolean)
    .join(" ");
  const addressLine = formatAddressLine(input);
  const privateEventCode =
    input.visibility === "PRIVATE" && input.eventCode ? input.eventCode : null;
  const subject = `New event created: ${input.eventTitle}`;
  const html = emailShell(
    "New event created",
    "Admin Alert",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A new event has been created on Paint &amp; Sip Depot.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        ${organizerLine ? `<p style="margin:0 0 10px;"><strong>Organizer:</strong> ${organizerLine}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Event:</strong> ${input.eventTitle}</p>
        ${input.status ? `<p style="margin:0 0 10px;"><strong>Status:</strong> ${formatEventStatusLabel(input.status)}</p>` : ""}
        ${input.eventFormat ? `<p style="margin:0 0 10px;"><strong>Format:</strong> ${formatEventFormatLabel(input.eventFormat)}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Visibility:</strong> ${input.visibility}</p>
        ${privateEventCode ? `<p style="margin:0 0 10px;"><strong>Event code:</strong> ${privateEventCode}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Starts:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        ${input.endDateTime ? `<p style="margin:0 0 10px;"><strong>Ends:</strong> ${formatDate(input.endDateTime)} at ${formatTime(input.endDateTime)}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Location:</strong> ${input.locationName}</p>
        ${addressLine ? `<p style="margin:0 0 10px;"><strong>Address:</strong> ${addressLine}</p>` : ""}
        ${typeof input.capacity === "number" ? `<p style="margin:0 0 10px;"><strong>Capacity:</strong> ${input.capacity}</p>` : ""}
        ${typeof input.ticketPriceCents === "number" ? `<p style="margin:0;"><strong>Ticket price:</strong> ${centsToDollars(input.ticketPriceCents)}</p>` : ""}
      </div>
      <p style="margin:20px 0 0;"><a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event</a></p>
    `
  );

  const text =
    `New event created: ${input.eventTitle}\n` +
    `${organizerLine ? `Organizer: ${organizerLine}\n` : ""}` +
    `${input.status ? `Status: ${formatEventStatusLabel(input.status)}\n` : ""}` +
    `${input.eventFormat ? `Format: ${formatEventFormatLabel(input.eventFormat)}\n` : ""}` +
    `Visibility: ${input.visibility}\n` +
    `${privateEventCode ? `Event code: ${privateEventCode}\n` : ""}` +
    `Starts: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n` +
    `${input.endDateTime ? `Ends: ${formatDate(input.endDateTime)} at ${formatTime(input.endDateTime)}\n` : ""}` +
    `Location: ${input.locationName}\n` +
    `${addressLine ? `Address: ${addressLine}\n` : ""}` +
    `${typeof input.capacity === "number" ? `Capacity: ${input.capacity}\n` : ""}` +
    `${typeof input.ticketPriceCents === "number" ? `Ticket price: ${centsToDollars(input.ticketPriceCents)}\n` : ""}` +
    `${input.eventUrl}`;

  await sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    text,
    from: getEventsFromEmail(),
  });
}

export async function sendHostEventCreatedEmail(input: EventCreatedEmailInput & { to: string }) {
  const subject = `Your event is live in Paint & Sip Depot`;
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const privateEventCode =
    input.visibility === "PRIVATE" && input.eventCode ? input.eventCode : null;
  const previewUrl = input.previewUrl || input.eventUrl;
  const html = emailShell(
    "Your event has been created",
    "Host Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your event <strong>${input.eventTitle}</strong> has been created successfully.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        <p style="margin:0 0 10px;"><strong>Location:</strong> ${input.locationName}</p>
        ${privateEventCode ? `<p style="margin:0 0 10px;"><strong>Event code:</strong> ${privateEventCode}</p>` : ""}
        <p style="margin:0;"><strong>Visibility:</strong> ${input.visibility}</p>
      </div>
      <p style="margin:20px 0 0;"><a href="${previewUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Preview Event Page</a></p>
    `
  );

  const text =
    `${greeting}\n` +
    `Your event "${input.eventTitle}" has been created successfully.\n` +
    `Date: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n` +
    `Location: ${input.locationName}\n` +
    `${privateEventCode ? `Event code: ${privateEventCode}\n` : ""}` +
    `Visibility: ${input.visibility}\n` +
    `Preview: ${previewUrl}`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
    from: getEventsFromEmail(),
  });
}

export async function sendAdminOrderCreatedEmail(input: OrderNotificationInput) {
  const organizerLine = [input.organizerName?.trim(), input.organizerEmail?.trim()]
    .filter(Boolean)
    .join(" ");
  const addressLine = formatAddressLine(input);
  const privateEventCode =
    input.visibility === "PRIVATE" && input.eventCode ? input.eventCode : null;
  const shippingMethod = [input.shippingProvider, input.shippingService].filter(Boolean).join(" ");
  const shippingHtml = input.shippingAmountCents
    ? `
        <p style="margin:0 0 10px;"><strong>Event kit shipping:</strong> ${shippingMethod || "USPS"} (${centsToDollars(input.shippingAmountCents)})</p>
        <p style="margin:0 0 10px;"><strong>Tracking:</strong> ${
          input.trackingNumber
            ? input.trackingUrl
              ? `<a href="${input.trackingUrl}" style="color:#000000;">${input.trackingNumber}</a>`
              : input.trackingNumber
            : "Pending fulfillment"
        }${input.trackingStatus ? ` (${input.trackingStatus})` : ""}</p>
      `
    : "";
  const shippingText = input.shippingAmountCents
    ? `Event kit shipping: ${shippingMethod || "USPS"} (${centsToDollars(input.shippingAmountCents)})\nTracking: ${
        input.trackingNumber || "Pending fulfillment"
      }${input.trackingStatus ? ` (${input.trackingStatus})` : ""}${input.trackingUrl ? `\nTracking link: ${input.trackingUrl}` : ""}\n`
    : "";
  const subject = `New order: ${input.quantity} ticket${input.quantity > 1 ? "s" : ""} for ${input.eventTitle}`;
  const html = emailShell(
    "New order received",
    "Admin Alert",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A new paid booking has been completed.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        ${organizerLine ? `<p style="margin:0 0 10px;"><strong>Organizer:</strong> ${organizerLine}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Event:</strong> ${input.eventTitle}</p>
        <p style="margin:0 0 10px;"><strong>Event date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        ${privateEventCode ? `<p style="margin:0 0 10px;"><strong>Event code:</strong> ${privateEventCode}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Location:</strong> ${input.locationName}</p>
        ${addressLine ? `<p style="margin:0 0 10px;"><strong>Address:</strong> ${addressLine}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Customer:</strong> ${input.purchaserName} (${input.purchaserEmail})</p>
        <p style="margin:0 0 10px;"><strong>Tickets:</strong> ${input.quantity}</p>
        <p style="margin:0 0 10px;"><strong>Total:</strong> ${centsToDollars(input.amountPaidCents)}</p>
        ${shippingHtml}
        ${input.purchasedAt ? `<p style="margin:0 0 10px;"><strong>Purchased at:</strong> ${formatDate(input.purchasedAt)} at ${formatTime(input.purchasedAt)}</p>` : ""}
        ${input.bookingId ? `<p style="margin:0;"><strong>Booking ID:</strong> ${input.bookingId}</p>` : ""}
      </div>
      <p style="margin:20px 0 0;"><a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event</a></p>
    `
  );

  const text =
    `New paid booking\n` +
    `${organizerLine ? `Organizer: ${organizerLine}\n` : ""}` +
    `Event: ${input.eventTitle}\n` +
    `Event date: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n` +
    `${privateEventCode ? `Event code: ${privateEventCode}\n` : ""}` +
    `Location: ${input.locationName}\n` +
    `${addressLine ? `Address: ${addressLine}\n` : ""}` +
    `Customer: ${input.purchaserName} (${input.purchaserEmail})\n` +
    `Tickets: ${input.quantity}\n` +
    `Total: ${centsToDollars(input.amountPaidCents)}\n` +
    shippingText +
    `${input.purchasedAt ? `Purchased at: ${formatDate(input.purchasedAt)} at ${formatTime(input.purchasedAt)}\n` : ""}` +
    `${input.bookingId ? `Booking ID: ${input.bookingId}\n` : ""}` +
    `${input.eventUrl}`;

  await sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    text,
    from: getTicketsFromEmail(),
  });
}

export async function sendHostOrderCreatedEmail(input: OrderNotificationInput & { to: string }) {
  const subject = `New ticket purchase for ${input.eventTitle}`;
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const privateEventCode =
    input.visibility === "PRIVATE" && input.eventCode ? input.eventCode : null;
  const previewUrl = input.previewUrl || input.eventUrl;
  const dashboardUrl = getAbsoluteUrl("/login");
  const shippingMethod = [input.shippingProvider, input.shippingService].filter(Boolean).join(" ");
  const shippingHtml = input.shippingAmountCents
    ? `
        <p style="margin:0 0 10px;"><strong>Event kit shipping:</strong> ${shippingMethod || "USPS"} (${centsToDollars(input.shippingAmountCents)})</p>
        <p style="margin:0 0 10px;"><strong>Tracking:</strong> ${
          input.trackingNumber
            ? input.trackingUrl
              ? `<a href="${input.trackingUrl}" style="color:#000000;">${input.trackingNumber}</a>`
              : input.trackingNumber
            : "Pending fulfillment"
        }${input.trackingStatus ? ` (${input.trackingStatus})` : ""}</p>
      `
    : "";
  const shippingText = input.shippingAmountCents
    ? `Event kit shipping: ${shippingMethod || "USPS"} (${centsToDollars(input.shippingAmountCents)})\nTracking: ${
        input.trackingNumber || "Pending fulfillment"
      }${input.trackingStatus ? ` (${input.trackingStatus})` : ""}${input.trackingUrl ? `\nTracking link: ${input.trackingUrl}` : ""}\n`
    : "";
  const html = emailShell(
    "New Ticket Purchased",
    "Host Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A ticket was just purchased for <strong>${input.eventTitle}</strong>.</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Check your dashboard to view the details.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Customer:</strong> ${input.purchaserName} (${input.purchaserEmail})</p>
        <p style="margin:0 0 10px;"><strong>Tickets:</strong> ${input.quantity}</p>
        <p style="margin:0 0 10px;"><strong>Total:</strong> ${centsToDollars(input.amountPaidCents)}</p>
        ${shippingHtml}
        <p style="margin:0 0 10px;"><strong>Event date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        ${privateEventCode ? `<p style="margin:0;"><strong>Event code:</strong> ${privateEventCode}</p>` : ""}
      </div>
      <div style="margin:20px 0 0;">
        <a href="${previewUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Preview Event Page</a>
        <a href="${dashboardUrl}" style="display:inline-block;margin-left:12px;padding:12px 18px;border-radius:999px;background:#000000;color:#ffffff;text-decoration:none;font-weight:700;">View Dashboard</a>
      </div>
    `
  );

  const text =
    `${greeting}\n` +
    `A ticket was just purchased for "${input.eventTitle}".\n` +
    `Check your dashboard to view the details.\n` +
    `Customer: ${input.purchaserName} (${input.purchaserEmail})\n` +
    `Tickets: ${input.quantity}\n` +
    `Total: ${centsToDollars(input.amountPaidCents)}\n` +
    shippingText +
    `Event date: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n` +
    `${privateEventCode ? `Event code: ${privateEventCode}\n` : ""}` +
    `Preview: ${previewUrl}\n` +
    `Dashboard: ${dashboardUrl}`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
    replyTo: getReplyToEmail(),
    from: getTicketsFromEmail(),
  });
}

export async function sendExpiredCheckoutEmail(input: ExpiredCheckoutEmailInput) {
  const firstName = getFirstName(input.purchaserName);
  const greeting = `Hi ${firstName},`;
  const subject = `Your checkout session expired for ${input.eventTitle}`;
  const html = emailShell(
    "Checkout session expired",
    "Booking Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        Your previous checkout session has expired, but you still have <strong>${input.timeLeftLabel}</strong> left to complete your order before checkout closes for your event.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        To make sure everything is processed correctly and your order is secured, you&apos;ll need to start a new checkout using the link below.
      </p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Event:</strong> ${input.eventTitle}</p>
        <p style="margin:0 0 10px;"><strong>Date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        <p style="margin:0;"><strong>Location:</strong> ${input.locationName}</p>
      </div>
      <p style="margin:20px 0 0;">
        <a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Complete Your Order</a>
      </p>
      <p style="margin:20px 0 0;font-size:16px;line-height:1.6;">
        We recommend completing your order as soon as possible so we can prepare your kits and ensure everything arrives on time for your event.
      </p>
      <p style="margin:16px 0 0;font-size:16px;line-height:1.6;">
        If you need help or have any questions, just reply here. We&apos;ve got you.
      </p>
      ${signatureBlock()}
    `
  );

  const text =
    `${greeting}\n\n` +
    `Your previous checkout session has expired, but you still have ${input.timeLeftLabel} left to complete your order before checkout closes for your event.\n\n` +
    `To make sure everything is processed correctly and your order is secured, you'll need to start a new checkout using the link below:\n\n` +
    `${input.eventUrl}\n\n` +
    `We recommend completing your order as soon as possible so we can prepare your kits and ensure everything arrives on time for your event.\n\n` +
    `If you need help or have any questions, just reply here — we've got you.\n\n` +
    `Paint & Sip Depot\n` +
    `Creating unforgettable paint & sip experiences\n` +
    `(803) 938-4775\n` +
    `info@paintsipdepot.com\n` +
    `www.paintsipdepot.com`;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    replyTo: getReplyToEmail(),
    from: getTicketsFromEmail(),
  });
}

export async function sendShopExpiredCheckoutEmail(input: ShopExpiredCheckoutEmailInput) {
  const firstName = getFirstName(input.customerName);
  const greeting = `Hi ${firstName},`;
  const subject = "Your Paint & Sip Depot checkout expired";
  const itemRows = input.items
    .map((item) => {
      const variantLabel = item.variantLabel && item.variantLabel !== "Standard"
        ? ` (${item.variantLabel})`
        : "";

      return `<li style="margin:0 0 8px;">${item.quantity} × ${item.productName}${variantLabel}</li>`;
    })
    .join("");
  const textItems = input.items
    .map((item) => {
      const variantLabel = item.variantLabel && item.variantLabel !== "Standard"
        ? ` (${item.variantLabel})`
        : "";

      return `- ${item.quantity} x ${item.productName}${variantLabel}`;
    })
    .join("\n");

  const html = emailShell(
    "Checkout session expired",
    "Shop Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        Your shop checkout session has expired before payment was completed.
      </p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 12px;"><strong>Order:</strong> ${input.orderId}</p>
        <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.6;">${itemRows}</ul>
      </div>
      <p style="margin:20px 0 0;">
        <a href="${input.shopUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Return to Shop</a>
      </p>
      <p style="margin:20px 0 0;font-size:16px;line-height:1.6;">
        If you still want these items, return to the shop and start a new checkout.
      </p>
      ${signatureBlock()}
    `
  );

  const text =
    `${greeting}\n\n` +
    `Your Paint & Sip Depot shop checkout session has expired before payment was completed.\n\n` +
    `Order: ${input.orderId}\n` +
    `${textItems}\n\n` +
    `Return to the shop to start a new checkout:\n${input.shopUrl}\n\n` +
    `Paint & Sip Depot\n` +
    `Creating unforgettable paint & sip experiences\n` +
    `(803) 938-4775\n` +
    `info@paintsipdepot.com\n`;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    replyTo: getReplyToEmail(),
    from: getOrdersFromEmail(),
  });
}

function buildShopOrderItems(input: ShopOrderConfirmationEmailInput) {
  const html = input.items
    .map((item) => {
      const details = [
        item.variantLabel && item.variantLabel !== "Standard" ? item.variantLabel : null,
        item.colorLabel ? `Color: ${item.colorLabel}` : null,
      ].filter(Boolean);

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;">
            <strong>${item.productName}</strong>
            ${details.length ? `<br /><span style="color:#525252;font-size:13px;">${details.join(" · ")}</span>` : ""}
          </td>
          <td align="center" style="padding:12px;border-bottom:1px solid #e5e5e5;">${item.quantity}</td>
          <td align="right" style="padding:12px;border-bottom:1px solid #e5e5e5;">${centsToDollars(item.unitPriceCents)}</td>
          <td align="right" style="padding:12px;border-bottom:1px solid #e5e5e5;">${centsToDollars(item.totalPriceCents)}</td>
        </tr>
      `;
    })
    .join("");
  const text = input.items
    .map((item) => {
      const details = [
        item.variantLabel && item.variantLabel !== "Standard" ? item.variantLabel : null,
        item.colorLabel ? `Color: ${item.colorLabel}` : null,
      ].filter(Boolean);
      const detailText = details.length ? ` (${details.join(", ")})` : "";

      return `- ${item.quantity} x ${item.productName}${detailText}: ${centsToDollars(item.totalPriceCents)}`;
    })
    .join("\n");

  return { html, text };
}

function buildShopShippingSummary(input: ShopOrderConfirmationEmailInput) {
  const method = [input.shippingProvider, input.shippingService].filter(Boolean).join(" ");
  const trackingLine = input.trackingNumber
    ? `<p style="margin:0 0 10px;"><strong>Tracking:</strong> ${
        input.trackingUrl
          ? `<a href="${input.trackingUrl}" style="color:#000000;">${input.trackingNumber}</a>`
          : input.trackingNumber
      }${input.trackingStatus ? ` (${input.trackingStatus})` : ""}</p>`
    : `<p style="margin:0 0 10px;"><strong>Tracking:</strong> Pending fulfillment</p>`;
  const textTracking = input.trackingNumber
    ? `Tracking: ${input.trackingNumber}${input.trackingStatus ? ` (${input.trackingStatus})` : ""}${
        input.trackingUrl ? `\nTracking link: ${input.trackingUrl}` : ""
      }`
    : "Tracking: Pending fulfillment";

  return {
    html: `
      <p style="margin:0 0 10px;"><strong>Shipping:</strong> ${method || "USPS"}</p>
      <p style="margin:0 0 10px;"><strong>Shipping cost:</strong> ${centsToDollars(input.shippingAmountCents)}</p>
      ${trackingLine}
    `,
    text: `Shipping: ${method || "USPS"}\nShipping cost: ${centsToDollars(input.shippingAmountCents)}\n${textTracking}`,
  };
}

export async function sendCustomerShopOrderConfirmationEmail(input: ShopOrderConfirmationEmailInput) {
  const firstName = getFirstName(input.customerName);
  const greeting = `Hi ${firstName},`;
  const subject = `Order confirmation: ${input.orderId}`;
  const itemRows = buildShopOrderItems(input);
  const shippingSummary = buildShopShippingSummary(input);
  const html = emailShell(
    "Order confirmed",
    "Order Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your Paint &amp; Sip Depot order has been paid successfully. We have included the order details below.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Order:</strong> ${input.orderId}</p>
        <p style="margin:0;"><strong>Customer:</strong> ${input.customerName} (${input.customerEmail})</p>
      </div>
      <table style="margin-top:20px;width:100%;border-collapse:collapse;border:1px solid #e5e5e5;background:#ffffff;font-size:14px;line-height:1.5;">
        <thead>
          <tr>
            <th align="left" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Item</th>
            <th align="center" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Qty</th>
            <th align="right" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Price</th>
            <th align="right" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows.html}</tbody>
      </table>
      <div style="margin:20px 0 0;padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Subtotal:</strong> ${centsToDollars(input.amountSubtotalCents)}</p>
        <p style="margin:0 0 10px;"><strong>Shipping:</strong> ${centsToDollars(input.shippingAmountCents)}</p>
        <p style="margin:0;font-size:18px;"><strong>Total paid:</strong> ${centsToDollars(input.amountTotalCents)}</p>
      </div>
      <div style="margin:20px 0 0;padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        ${shippingSummary.html}
      </div>
      <p style="margin:20px 0 0;"><a href="${input.orderUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Order</a></p>
      ${signatureBlock()}
    `
  );
  const text =
    `${greeting}\n\n` +
    `Your Paint & Sip Depot order has been paid successfully.\n\n` +
    `Order: ${input.orderId}\n` +
    `Customer: ${input.customerName} (${input.customerEmail})\n\n` +
    `${itemRows.text}\n\n` +
    `Subtotal: ${centsToDollars(input.amountSubtotalCents)}\n` +
    `Shipping: ${centsToDollars(input.shippingAmountCents)}\n` +
    `Total paid: ${centsToDollars(input.amountTotalCents)}\n\n` +
    `${shippingSummary.text}\n\n` +
    `View order: ${input.orderUrl}`;

  return sendEmail({
    to: input.customerEmail,
    subject,
    html,
    text,
    replyTo: getReplyToEmail(),
    from: getOrdersFromEmail(),
  });
}

export async function sendAdminShopOrderConfirmationEmail(input: ShopOrderConfirmationEmailInput) {
  const subject = `New shop order: ${input.orderId}`;
  const itemRows = buildShopOrderItems(input);
  const shippingSummary = buildShopShippingSummary(input);
  const html = emailShell(
    "New shop order",
    "Admin Alert",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A customer completed a shop checkout.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Order:</strong> ${input.orderId}</p>
        <p style="margin:0;"><strong>Customer:</strong> ${input.customerName} (${input.customerEmail})</p>
      </div>
      <table style="margin-top:20px;width:100%;border-collapse:collapse;border:1px solid #e5e5e5;background:#ffffff;font-size:14px;line-height:1.5;">
        <thead>
          <tr>
            <th align="left" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Item</th>
            <th align="center" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Qty</th>
            <th align="right" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Price</th>
            <th align="right" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows.html}</tbody>
      </table>
      <div style="margin:20px 0 0;padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Subtotal:</strong> ${centsToDollars(input.amountSubtotalCents)}</p>
        <p style="margin:0 0 10px;"><strong>Shipping:</strong> ${centsToDollars(input.shippingAmountCents)}</p>
        <p style="margin:0;font-size:18px;"><strong>Total paid:</strong> ${centsToDollars(input.amountTotalCents)}</p>
      </div>
      <div style="margin:20px 0 0;padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        ${shippingSummary.html}
      </div>
      <p style="margin:20px 0 0;"><a href="${input.orderUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Order</a></p>
    `
  );
  const text =
    `New shop order\n\n` +
    `Order: ${input.orderId}\n` +
    `Customer: ${input.customerName} (${input.customerEmail})\n\n` +
    `${itemRows.text}\n\n` +
    `Subtotal: ${centsToDollars(input.amountSubtotalCents)}\n` +
    `Shipping: ${centsToDollars(input.shippingAmountCents)}\n` +
    `Total paid: ${centsToDollars(input.amountTotalCents)}\n\n` +
    `${shippingSummary.text}\n\n` +
    `View order: ${input.orderUrl}`;

  return sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    text,
    replyTo: input.customerEmail,
    from: getOrdersFromEmail(),
  });
}

export async function sendAdminReturnSubmissionEmail(input: ReturnSubmissionEmailInput) {
  const subject = `Return request: ${input.orderNumber}`;
  const photoList = input.photoUrls.length
    ? input.photoUrls
        .map((url) => `<li><a href="${url}" style="color:#111111;">${url}</a></li>`)
        .join("")
    : "<li>No photos provided</li>";
  const html = emailShell(
    "New return request",
    "Admin Alert",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A customer submitted a return request.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Order number:</strong> ${input.orderNumber}</p>
        <p style="margin:0 0 10px;"><strong>Customer:</strong> ${input.customerName}</p>
        <p style="margin:0 0 10px;"><strong>Email:</strong> ${input.customerEmail}</p>
        ${input.phoneNumber ? `<p style="margin:0 0 10px;"><strong>Phone:</strong> ${input.phoneNumber}</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Issue:</strong> ${input.issueType}</p>
        ${input.didNotReceiveOrder ? `<p style="margin:0 0 10px;"><strong>Order received:</strong> No</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Description:</strong></p>
        <p style="margin:0 0 10px;white-space:pre-line;">${input.description}</p>
        <p style="margin:0 0 10px;"><strong>Photos:</strong></p>
        <ul style="margin:0;padding-left:18px;">${photoList}</ul>
        <p style="margin:10px 0 0;"><strong>Submission ID:</strong> ${input.id}</p>
      </div>
      <p style="margin:20px 0 0;"><a href="${input.adminUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Review Return Request</a></p>
    `
  );

  const text =
    `New return request\n` +
    `Order number: ${input.orderNumber}\n` +
    `Customer: ${input.customerName}\n` +
    `Email: ${input.customerEmail}\n` +
    `${input.phoneNumber ? `Phone: ${input.phoneNumber}\n` : ""}` +
    `Issue: ${input.issueType}\n` +
    `${input.didNotReceiveOrder ? "Order received: No\n" : ""}` +
    `Description: ${input.description}\n` +
    `Photos: ${input.photoUrls.length ? input.photoUrls.join(", ") : "No photos provided"}\n` +
    `Review: ${input.adminUrl}`;

  await sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    text,
    replyTo: input.customerEmail,
    from: getReturnsFromEmail(),
  });
}

export async function sendCustomerReturnSubmissionEmail(input: ReturnSubmissionEmailInput) {
  const firstName = getFirstName(input.customerName);
  const greeting = `Hi ${firstName},`;
  const subject = `We received your return request for ${input.orderNumber}`;
  const html = emailShell(
    "Return request received",
    "Returns Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We received your return request and our team will review it.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Order number:</strong> ${input.orderNumber}</p>
        <p style="margin:0 0 10px;"><strong>Issue:</strong> ${input.issueType}</p>
        ${input.didNotReceiveOrder ? `<p style="margin:0 0 10px;"><strong>Order received:</strong> No</p>` : ""}
        <p style="margin:0 0 10px;"><strong>Description:</strong></p>
        <p style="margin:0;white-space:pre-line;">${input.description}</p>
      </div>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#525252;">Return submission ID: ${input.id}</p>
      ${signatureBlock()}
    `
  );
  const text =
    `${greeting}\n\n` +
    `We received your return request and our team will review it.\n\n` +
    `Order number: ${input.orderNumber}\n` +
    `Issue: ${input.issueType}\n` +
    `${input.didNotReceiveOrder ? "Order received: No\n" : ""}` +
    `Description: ${input.description}\n` +
    `Return submission ID: ${input.id}`;

  return sendEmail({
    to: input.customerEmail,
    subject,
    html,
    text,
    replyTo: getReplyToEmail(),
    from: getReturnsFromEmail(),
  });
}

export async function sendEventUpdatedEmail(input: EventUpdatedEmailInput) {
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const subject = `Event update: ${input.eventTitle}`;
  const addressLine = formatAddressLine(input);
  const detailUrl = input.audience === "host" || input.audience === "admin"
    ? input.previewUrl || input.eventUrl
    : input.eventUrl;
  const changeRows = input.changes
    .map(
      (change) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-weight:700;vertical-align:top;">${change.label}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;color:#525252;vertical-align:top;">${change.previousValue}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e5e5;vertical-align:top;">${change.nextValue}</td>
        </tr>
      `
    )
    .join("");
  const textChanges = input.changes
    .map((change) => `${change.label}: ${change.previousValue} -> ${change.nextValue}`)
    .join("\n");

  const html = emailShell(
    "Event details updated",
    "Event Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Important details changed for <strong>${input.eventTitle}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;background:#ffffff;font-size:14px;line-height:1.5;">
        <thead>
          <tr>
            <th align="left" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Changed</th>
            <th align="left" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">Previous</th>
            <th align="left" style="padding:12px;border-bottom:1px solid #111111;background:#f7f7f7;">New</th>
          </tr>
        </thead>
        <tbody>${changeRows}</tbody>
      </table>
      <div style="margin:20px 0 0;padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Current date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        <p style="margin:0 0 10px;"><strong>Current location:</strong> ${input.locationName}</p>
        ${addressLine ? `<p style="margin:0;"><strong>Current address:</strong> ${addressLine}</p>` : ""}
      </div>
      <p style="margin:20px 0 0;"><a href="${detailUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event</a></p>
      ${signatureBlock()}
    `
  );

  const text =
    `${greeting}\n\n` +
    `Important details changed for ${input.eventTitle}.\n\n` +
    `${textChanges}\n\n` +
    `Current date: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n` +
    `Current location: ${input.locationName}\n` +
    `${addressLine ? `Current address: ${addressLine}\n` : ""}` +
    `View event: ${detailUrl}`;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
    from: getEventsFromEmail(),
    replyTo: getReplyToEmail(),
  });
}

export async function sendAdminEventUpdatedEmail(
  input: Omit<EventUpdatedEmailInput, "to" | "audience">
) {
  return sendEventUpdatedEmail({
    ...input,
    to: getAdminEmail(),
    recipientName: "Admin",
    audience: "admin",
  });
}

export async function sendVerificationEmail(input: VerificationEmailInput) {
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const subject = "Verify your Paint & Sip Depot account";
  const html = emailShell(
    "Verify your email",
    "Account Setup",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Enter this code on Paint &amp; Sip Depot to activate your host account.</p>
      <div style="margin:20px 0;padding:18px;border:1px solid #111111;border-radius:18px;background:#ffffff;text-align:center;font-size:34px;letter-spacing:0.28em;font-weight:800;color:#111111;">${input.code}</div>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#525252;">This code expires at ${formatTime(input.expires)}. If you did not create this account, you can ignore this email.</p>
    `
  );
  const text = `${greeting}\nEnter this code to verify your Paint & Sip Depot account: ${input.code}\nThis code expires at ${formatTime(input.expires)}.`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
    from: getAccountFromEmail(),
  });
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const subject = "Reset your Paint & Sip Depot password";
  const html = emailShell(
    "Reset your password",
    "Account Security",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Use the secure link below to choose a new password for your Paint &amp; Sip Depot account.</p>
      <p style="margin:20px 0;">
        <a href="${input.resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Reset Password</a>
      </p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#525252;">This link expires at ${formatTime(input.expires)}. If you did not request a password reset, you can ignore this email.</p>
    `
  );
  const text = `${greeting}\nUse this link to reset your Paint & Sip Depot password:\n${input.resetUrl}\n\nThis link expires at ${formatTime(input.expires)}.`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
    from: getAccountFromEmail(),
  });
}
