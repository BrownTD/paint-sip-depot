import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { getAdminShippingOrders } from "@/lib/admin-shipping";
import { formatCurrencyAmount } from "@/lib/money";
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
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .formatToParts(date)
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

export default async function AdminShippingPage() {
  await requireAdminSession();
  const orders = await getAdminShippingOrders();
  const labelCount = orders.filter((order) => order.labelUrl).length;
  const fulfilledCount = orders.filter((order) => order.status === "FULFILLED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Shipping</h1>
          <p className="mt-1 text-muted-foreground">
            Review paid shop orders, buy labels, and manage tracking.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Ticket Orders</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Shop Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Labels Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labelCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fulfilledCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No paid shop orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Shipping</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Arrives By</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tracking</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p>{[order.shippingProvider, order.shippingService].filter(Boolean).join(" ") || "USPS"}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.labelUrl ? "Label ready" : "No label yet"}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p>{formatShippoArrivesBy(order.shippingArrivesBy) || "Not returned"}</p>
                        {order.shippingEstimatedDays ? (
                          <p className="text-sm text-muted-foreground">
                            {order.shippingEstimatedDays} carrier day{order.shippingEstimatedDays === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top font-medium">
                        {formatCurrencyAmount(order.shippingAmountCents, order.currency)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p>{order.trackingNumber || "Not created"}</p>
                        <p className="text-sm text-muted-foreground">{order.trackingStatus || "Pending"}</p>
                        {order.trackingStatusDetails ? (
                          <p className="max-w-[22rem] text-sm text-muted-foreground">{order.trackingStatusDetails}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getStatusVariant(order.status)}>{order.status.toLowerCase()}</Badge>
                          {order.shippoOrderStatus ? (
                            <Badge variant="outline">Shippo {order.shippoOrderStatus.toLowerCase()}</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <Button asChild size="sm">
                          <Link href={`/admin/shipping/${order.id}`}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
