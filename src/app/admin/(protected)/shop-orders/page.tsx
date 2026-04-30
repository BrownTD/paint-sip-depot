import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { getAdminShopOrders } from "@/lib/admin-shipping";
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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminShopOrdersPage() {
  await requireAdminSession();
  const orders = await getAdminShopOrders();
  const fulfilledCount = orders.filter((order) => order.status === "FULFILLED").length;
  const totalRevenueCents = orders.reduce((sum, order) => sum + order.amountTotalCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Shop Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Review customer shop purchases, products, payment totals, and fulfillment status.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Ticket Orders</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shop Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyAmount(totalRevenueCents, "usd")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shop Orders</CardTitle>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Paid</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Shipping</th>
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
                        <div className="space-y-1">
                          {order.items.slice(0, 3).map((item) => (
                            <p key={item.id} className="text-sm">
                              {item.quantity} x {item.productNameSnapshot}
                            </p>
                          ))}
                          {order.items.length > 3 ? (
                            <p className="text-sm text-muted-foreground">+{order.items.length - 3} more</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-medium">
                        {formatCurrencyAmount(order.amountTotalCents, order.currency)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm">{formatCurrencyAmount(order.shippingAmountCents, order.currency)}</p>
                        <p className="text-sm text-muted-foreground">{order.trackingNumber || "Tracking pending"}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={getStatusVariant(order.status)}>{order.status.toLowerCase()}</Badge>
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
