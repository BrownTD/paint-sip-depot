import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Calendar, DollarSign, Ticket, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardStats(hostId: string) {
  const [totalEvents, publishedEvents, totalBookings, revenueResult] = await Promise.all([
    prisma.event.count({ where: { hostId } }),
    prisma.event.count({ where: { hostId, status: "PUBLISHED" } }),
    prisma.booking.count({ where: { event: { hostId }, status: "PAID" } }),
    prisma.booking.aggregate({
      where: { event: { hostId }, status: "PAID" },
      _sum: { amountPaidCents: true },
    }),
  ]);

  return {
    totalEvents,
    publishedEvents,
    totalBookings,
    totalRevenue: revenueResult._sum.amountPaidCents || 0,
  };
}

async function getUpcomingEvents(hostId: string) {
  return prisma.event.findMany({
    where: { hostId, startDateTime: { gt: new Date() }, status: { in: ["PUBLISHED", "DRAFT"] } },
    include: { _count: { select: { bookings: { where: { status: "PAID" } } } } },
    orderBy: { startDateTime: "asc" },
    take: 5,
  });
}

async function getRecentBookings(hostId: string) {
  return prisma.booking.findMany({
    where: { event: { hostId }, status: "PAID" },
    include: { event: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [stats, upcomingEvents, recentBookings] = await Promise.all([
    getDashboardStats(session.user.id),
    getUpcomingEvents(session.user.id),
    getRecentBookings(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Welcome back, {session.user.name?.split(" ")[0] || "Host"}!
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your events</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmountForDisplay(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all paid bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Confirmed tickets sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedEvents}</div>
            <p className="text-xs text-muted-foreground">{stats.totalEvents} total events created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. per Event</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEvents > 0 ? Math.round(stats.totalBookings / stats.totalEvents) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Guests per event</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href="/dashboard/events">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upcoming events</p>
                <Link href="/dashboard/events/new">
                  <Button>Create Your First Event</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(event.startDateTime)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{event._count.bookings} / {event.capacity}</p>
                      <p className="text-xs text-muted-foreground">guests</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link href="/dashboard/bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{booking.purchaserName}</p>
                      <p className="text-sm text-muted-foreground">{booking.event.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatAmountForDisplay(booking.amountPaidCents)}</p>
                      <p className="text-xs text-muted-foreground">{booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}