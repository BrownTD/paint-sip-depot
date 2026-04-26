import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin";
import { getAdminShippingOrder } from "@/lib/admin-shipping";
import { formatCurrencyAmount } from "@/lib/money";
import { AdminShippingActions } from "@/components/admin/admin-shipping-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusVariants = {
  PAID: "success",
  FULFILLED: "success",
  REFUNDED: "warning",
  CANCELED: "destructive",
  EXPIRED: "outline",
  PENDING: "secondary",
} as const;

function getStatusVariant(status: string) {
  return statusVariants[status as keyof typeof statusVariants] ?? "secondary";
}

function formatDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.month} ${parts.day}, ${parts.year} at ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}

function formatShippoArrivesBy(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function shippingAddress(order: NonNullable<Awaited<ReturnType<typeof getAdminShippingOrder>>>) {
  return [
    order.shippingName,
    order.shippingAddress,
    [order.shippingCity, order.shippingState, order.shippingZip].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" | ");
}

function splitExternalLinks(value: string | null) {
  return value?.split(",").map((link) => link.trim()).filter(Boolean) ?? [];
}

export default async function AdminShippingOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireAdminSession();
  const { orderId } = await params;
  const order = await getAdminShippingOrder(orderId);

  if (!order) {
    notFound();
  }

  const labelUrls = splitExternalLinks(order.labelUrl);
  const trackingUrls = splitExternalLinks(order.trackingUrl);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link href="/admin/shipping">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to shipping
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">Shipping Order</h1>
          <p className="mt-1 text-muted-foreground">{order.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getStatusVariant(order.status)}>{order.status.toLowerCase()}</Badge>
          {order.shippoOrderStatus ? (
            <Badge variant="outline">Shippo {order.shippoOrderStatus.toLowerCase()}</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="mt-1 font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Placed</p>
                <p className="mt-1">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shipping To</p>
                <p className="mt-1">{shippingAddress(order) || "No shipping address saved"}</p>
                {order.shippingPhone ? <p className="text-sm text-muted-foreground">{order.shippingPhone}</p> : null}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected Service</p>
                <p className="mt-1">
                  {[order.shippingProvider, order.shippingService].filter(Boolean).join(" ") || "USPS"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrencyAmount(order.shippingAmountCents, order.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Estimate</p>
                <p className="mt-1">{order.shippingEstimateLabel || "No estimate saved"}</p>
                <p className="text-sm text-muted-foreground">
                  Shippo arrives by: {formatShippoArrivesBy(order.shippingArrivesBy) || "Not returned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Options</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{item.productNameSnapshot}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {[item.variantLabelSnapshot !== "Standard" ? item.variantLabelSnapshot : null, item.colorLabelSnapshot]
                            .filter(Boolean)
                            .join(" | ") || "Standard"}
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrencyAmount(item.totalPriceCents, item.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminShippingActions
                orderId={order.id}
                labelUrl={order.labelUrl}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
                qrCodeUrl={order.qrCodeUrl}
                packingSlipUrl={order.packingSlipUrl}
                shippoRateId={order.shippoRateId}
                status={order.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shippo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Shipment ID</p>
                <p className="break-all">{order.shippoShipmentId || "None"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Rate ID</p>
                <p className="break-all">{order.shippoRateId || "None"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Order ID</p>
                <p className="break-all">{order.shippoOrderId || "None"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Transaction ID</p>
                <p className="break-all">{order.shippoTransactionId || "None"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Number</p>
                <p>{order.trackingNumber || "Not created"}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                <p>{order.trackingStatus || "Pending"}</p>
                {order.trackingStatusDetails ? (
                  <div className="mt-2 rounded-md border bg-muted/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Substatus details
                    </p>
                    <p className="mt-1 text-muted-foreground">{order.trackingStatusDetails}</p>
                  </div>
                ) : null}
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Links</p>
                <p>{labelUrls.length} label link{labelUrls.length === 1 ? "" : "s"}</p>
                <p>{trackingUrls.length} tracking link{trackingUrls.length === 1 ? "" : "s"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
