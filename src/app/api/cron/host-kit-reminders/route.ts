import { NextResponse } from "next/server";
import { sendDueHostKitReminderEmails } from "@/lib/host-kit";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendDueHostKitReminderEmails();
  return NextResponse.json({
    checked: results.length,
    sent: results.filter((result) => result.sent).length,
    results,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
