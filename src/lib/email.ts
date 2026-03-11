import { formatDate, formatTime, getAbsoluteUrl } from "@/lib/utils";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";
const DEFAULT_ADMIN_EMAIL = "info@paintsipdepot.com";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

type EventCreatedEmailInput = {
  recipientName?: string | null;
  eventTitle: string;
  eventUrl: string;
  startDateTime: Date;
  locationName: string;
  visibility: "PUBLIC" | "PRIVATE";
};

type VerificationEmailInput = {
  to: string;
  recipientName?: string | null;
  verificationUrl: string;
};

type OrderNotificationInput = {
  recipientName?: string | null;
  eventTitle: string;
  eventUrl: string;
  startDateTime: Date;
  locationName: string;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
  amountPaidCents: number;
};

function getResendApiKey() {
  return process.env.RESEND_API_KEY;
}

function getFromEmail() {
  return DEFAULT_FROM_EMAIL;
}

function getAdminEmail() {
  return process.env.ORDER_ALERT_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
}

function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function emailShell(title: string, eyebrow: string, bodyHtml: string) {
  const logoUrl = getAbsoluteUrl("/psdLogo.png");

  return `
    <div style="margin:0;padding:24px;background:#000000;font-family:Arial,sans-serif;color:#000000;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #1f1f1f;">
        <div style="padding:28px 32px;background:#000000;border-bottom:4px solid #feaa08;">
          <img src="${logoUrl}" alt="Paint & Sip Depot" style="height:56px;width:auto;display:block;margin-bottom:16px;" />
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

async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing; skipping email send.");
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Resend email failed (${response.status}): ${errorBody}`);
  }
}

export async function sendAdminEventCreatedEmail(input: EventCreatedEmailInput) {
  const subject = `New event created: ${input.eventTitle}`;
  const html = emailShell(
    "New event created",
    "Admin Alert",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A new event has been created on Paint &amp; Sip Depot.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Event:</strong> ${input.eventTitle}</p>
        <p style="margin:0 0 10px;"><strong>Date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        <p style="margin:0 0 10px;"><strong>Location:</strong> ${input.locationName}</p>
        <p style="margin:0;"><strong>Visibility:</strong> ${input.visibility}</p>
      </div>
      <p style="margin:20px 0 0;"><a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event</a></p>
    `
  );

  const text = `New event created: ${input.eventTitle}\nDate: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\nLocation: ${input.locationName}\nVisibility: ${input.visibility}\n${input.eventUrl}`;

  await sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    text,
  });
}

export async function sendHostEventCreatedEmail(input: EventCreatedEmailInput & { to: string }) {
  const subject = `Your event is live in Paint & Sip Depot`;
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const html = emailShell(
    "Your event has been created",
    "Host Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your event <strong>${input.eventTitle}</strong> has been created successfully.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
        <p style="margin:0 0 10px;"><strong>Location:</strong> ${input.locationName}</p>
        <p style="margin:0;"><strong>Visibility:</strong> ${input.visibility}</p>
      </div>
      <p style="margin:20px 0 0;"><a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event Page</a></p>
    `
  );

  const text = `${greeting}\nYour event "${input.eventTitle}" has been created successfully.\nDate: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\nLocation: ${input.locationName}\nVisibility: ${input.visibility}\n${input.eventUrl}`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
  });
}

export async function sendAdminOrderCreatedEmail(input: OrderNotificationInput) {
  const subject = `New order: ${input.quantity} ticket${input.quantity > 1 ? "s" : ""} for ${input.eventTitle}`;
  const html = emailShell(
    "New order received",
    "Admin Alert",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A new paid booking has been completed.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Event:</strong> ${input.eventTitle}</p>
        <p style="margin:0 0 10px;"><strong>Customer:</strong> ${input.purchaserName} (${input.purchaserEmail})</p>
        <p style="margin:0 0 10px;"><strong>Tickets:</strong> ${input.quantity}</p>
        <p style="margin:0 0 10px;"><strong>Total:</strong> ${centsToDollars(input.amountPaidCents)}</p>
        <p style="margin:0;"><strong>Event date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
      </div>
      <p style="margin:20px 0 0;"><a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event</a></p>
    `
  );

  const text = `New paid booking\nEvent: ${input.eventTitle}\nCustomer: ${input.purchaserName} (${input.purchaserEmail})\nTickets: ${input.quantity}\nTotal: ${centsToDollars(input.amountPaidCents)}\nEvent date: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n${input.eventUrl}`;

  await sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    text,
  });
}

export async function sendHostOrderCreatedEmail(input: OrderNotificationInput & { to: string }) {
  const subject = `New ticket purchase for ${input.eventTitle}`;
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hi,";
  const html = emailShell(
    "A new order came in",
    "Host Update",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">You have a new paid booking for <strong>${input.eventTitle}</strong>.</p>
      <div style="padding:20px;border:1px solid #000000;border-radius:18px;background:#ffffff;">
        <p style="margin:0 0 10px;"><strong>Customer:</strong> ${input.purchaserName} (${input.purchaserEmail})</p>
        <p style="margin:0 0 10px;"><strong>Tickets:</strong> ${input.quantity}</p>
        <p style="margin:0 0 10px;"><strong>Total:</strong> ${centsToDollars(input.amountPaidCents)}</p>
        <p style="margin:0;"><strong>Event date:</strong> ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}</p>
      </div>
      <p style="margin:20px 0 0;"><a href="${input.eventUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">View Event Page</a></p>
    `
  );

  const text = `${greeting}\nYou have a new paid booking for "${input.eventTitle}".\nCustomer: ${input.purchaserName} (${input.purchaserEmail})\nTickets: ${input.quantity}\nTotal: ${centsToDollars(input.amountPaidCents)}\nEvent date: ${formatDate(input.startDateTime)} at ${formatTime(input.startDateTime)}\n${input.eventUrl}`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
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
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Please verify your email address to activate your Paint &amp; Sip Depot host account.</p>
      <p style="margin:20px 0;">
        <a href="${input.verificationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#feaa08;color:#000000;text-decoration:none;font-weight:700;">Verify Email</a>
      </p>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#525252;">If you did not create this account, you can ignore this email.</p>
    `
  );
  const text = `${greeting}\nPlease verify your Paint & Sip Depot account:\n${input.verificationUrl}`;

  await sendEmail({
    to: input.to,
    subject,
    html,
    text,
  });
}
