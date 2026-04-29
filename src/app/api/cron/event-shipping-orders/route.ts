import { NextResponse } from "next/server";
import { createDueEventShippingOrders } from "@/lib/event-shipping";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await createDueEventShippingOrders();
  return NextResponse.json({
    checked: results.length,
    created: results.filter((result) => result.status === "created").length,
    results: results.map((result) => ({
      status: result.status,
      shippingOrderId: result.shippingOrder?.id ?? null,
    })),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
