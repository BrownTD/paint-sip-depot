import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function getOrders() {
  return prisma.booking.findMany({
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDateTime: true,
          locationName: true,
          host: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const statusColors = {
  PENDING: "secondary",
  RESERVED: "secondary",
  PAID: "success",
  REFUNDED: "warning",
  EXPIRED: "outline",
  CANCELED: "destructive",
} as const;

export default async function AdminOrdersPage() {
  await requireAdminSession();
  const orders = await getOrders();

  const paidTickets = orders
    .filter((order) => order.status === "PAID")
    .reduce((sum, order) => sum + order.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            Review all bookings and payment statuses for fulfillment.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/events">View Events</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((order) => order.status === "PAID").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Host</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tickets</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 align-top">
                        <div>
                          <p className="font-medium">{order.purchaserName}</p>
                          <p className="text-sm text-muted-foreground">{order.purchaserEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <Link href={`/e/${order.event.slug}`} className="font-medium text-primary hover:underline">
                            {order.event.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.event.startDateTime)} at {order.event.locationName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>
                          <p className="font-medium">{order.event.host.name || "Unknown host"}</p>
                          <p className="text-sm text-muted-foreground">{order.event.host.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {order.quantity} ticket{order.quantity > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 align-top font-medium">
                        {formatAmountForDisplay(order.amountPaidCents)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={statusColors[order.status]}>{order.status.toLowerCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
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
