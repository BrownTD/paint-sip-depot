import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ShippoWebhookPayload = Record<string, unknown>;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNestedString(payload: ShippoWebhookPayload, key: string, nestedKey: string) {
  const nested = payload[key];
  if (!nested || typeof nested !== "object") return null;
  return readString((nested as Record<string, unknown>)[nestedKey]);
}

function getTrackingStatus(payload: ShippoWebhookPayload) {
  const direct = readString(payload.tracking_status);
  if (direct) return direct;

  return readNestedString(payload, "tracking_status", "status");
}

function getTrackingStatusDetails(payload: ShippoWebhookPayload) {
  return readNestedString(payload, "tracking_status", "status_details");
}

async function updateMatchingOrders(data: {
  shippoOrderId?: string | null;
  shippoTransactionId?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingStatus?: string | null;
  trackingStatusDetails?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  qrCodeUrl?: string | null;
}) {
  const updateData = {
    shippoTransactionId: data.shippoTransactionId ?? undefined,
    trackingCarrier: data.trackingCarrier ?? undefined,
    trackingNumber: data.trackingNumber ?? undefined,
    trackingStatus: data.trackingStatus ?? undefined,
    trackingStatusDetails: data.trackingStatusDetails ?? undefined,
    trackingUrl: data.trackingUrl ?? undefined,
    labelUrl: data.labelUrl ?? undefined,
    qrCodeUrl: data.qrCodeUrl ?? undefined,
  };

  const whereClauses: Array<Record<string, string>> = [];
  if (data.shippoOrderId) whereClauses.push({ shippoOrderId: data.shippoOrderId });
  if (data.shippoTransactionId) whereClauses.push({ shippoTransactionId: data.shippoTransactionId });
  if (data.trackingNumber) whereClauses.push({ trackingNumber: data.trackingNumber });

  for (const where of whereClauses) {
    await prisma.shopOrder.updateMany({
      where,
      data: updateData,
    });
    await prisma.booking.updateMany({
      where,
      data: updateData,
    });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ShippoWebhookPayload;
    const shippoTransactionId = readString(payload.object_id) || readString(payload.transaction);
    const shippoOrderId = readString(payload.order);
    const trackingNumber = readString(payload.tracking_number);
    const trackingCarrier = readString(payload.carrier) || "usps";
    const trackingStatus = getTrackingStatus(payload);
    const trackingStatusDetails = getTrackingStatusDetails(payload);
    const trackingUrl = readString(payload.tracking_url_provider);
    const labelUrl = readString(payload.label_url);
    const qrCodeUrl = readString(payload.qr_code_url);

    await updateMatchingOrders({
      shippoOrderId,
      shippoTransactionId,
      trackingNumber,
      trackingCarrier,
      trackingStatus,
      trackingStatusDetails,
      trackingUrl,
      labelUrl,
      qrCodeUrl,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Shippo webhook handler error:", error);
    return NextResponse.json({ error: "Shippo webhook handler failed" }, { status: 500 });
  }
}
