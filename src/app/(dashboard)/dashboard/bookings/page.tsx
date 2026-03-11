import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getHostBookings(hostId: string) {
  return prisma.booking.findMany({
    where: { event: { hostId } },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDateTime: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

type HostBooking = Awaited<ReturnType<typeof getHostBookings>>[number];

const statusColors = {
  PENDING: "secondary",
  RESERVED: "secondary",
  PAID: "success",
  REFUNDED: "warning",
  EXPIRED: "outline",
  CANCELED: "destructive",
} as const;

const statusLabels = {
  PENDING: "Processing",
  RESERVED: "Checkout in progress",
  PAID: "Paid",
  REFUNDED: "Refunded by admin",
  EXPIRED: "Checkout expired",
  CANCELED: "Canceled",
} as const;

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const bookings = await getHostBookings(session.user.id);

  const totalTickets = bookings
    .filter((b: HostBooking) => b.status === "PAID")
    .reduce((sum: number, b: HostBooking) => sum + b.quantity, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Tickets</h1>
        <p className="text-muted-foreground mt-1">View and manage all ticket bookings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Purchases Yet</h2>
            <p className="text-muted-foreground mb-6">
              Tickets will appear here once guests checkout
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Guest
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Event
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Tickets
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking: HostBooking) => (
                    <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{booking.purchaserName}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.purchaserEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/events/${booking.event.id}`}
                          className="text-primary hover:underline"
                        >
                          {booking.event.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.event.startDateTime)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatAmountForDisplay(booking.amountPaidCents)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColors[booking.status as keyof typeof statusColors]}>
                          {statusLabels[booking.status as keyof typeof statusLabels]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
