import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCheckoutTotalCents } from "@/lib/checkout-pricing";
import { stripe } from "@/lib/stripe";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Booking Confirmed",
};

async function getBookingDetails(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return null;
    }

    const booking = await prisma.booking.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        event: {
          include: {
            host: { select: { name: true } },
          },
        },
      },
    });

    return booking ? { booking, session } : null;
  } catch {
    return null;
  }
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  if (!searchParams.session_id) {
    redirect("/");
  }

  const details = await getBookingDetails(searchParams.session_id);

  if (!details) {
    redirect("/");
  }

  const { booking, session } = details;
  const event = booking.event;
  const pricing = getCheckoutTotalCents(event.ticketPriceCents, booking.quantity, {
    includeShipping: false,
  });
  const shippingCents = booking.shippingAmountCents;
  const taxCents = session.total_details?.amount_tax ?? Math.max(0, (session.amount_total ?? booking.amountPaidCents) - pricing.totalCents - shippingCents);
  const totalPaidCents = session.amount_total ?? booking.amountPaidCents;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Image src="/Misc/logo.svg" alt="Paint & Sip Depot" width={24} height={24} priority />
            </div>
            <span className="font-display font-bold">Paint & Sip Depot</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <Image src="/Misc/logo.svg" alt="Paint & Sip Depot" width={52} height={52} priority />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground">Your booking has been confirmed.</p>
        </div>

        {/* Booking Details */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Event Info */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">
                {event.title}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {formatDate(event.startDateTime)} at{" "}
                    {formatTime(event.startDateTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {event.locationName}, {event.city}, {event.state}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Ticket className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Guest Info */}
            <div>
              <h3 className="font-medium mb-2">Guest Information</h3>
              <p className="text-sm text-muted-foreground">
                Name: {booking.purchaserName}
                <br />
                Email: {booking.purchaserEmail}
              </p>
            </div>

            <Separator />

            {/* Payment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tickets</span>
                <span>{formatAmountForDisplay(pricing.subtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing Fee</span>
                <span>{formatAmountForDisplay(pricing.processingFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatAmountForDisplay(shippingCents)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxes</span>
                <span>{formatAmountForDisplay(taxCents)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Total Paid</span>
                <span className="text-xl font-bold">
                  {formatAmountForDisplay(totalPaidCents)}
                </span>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Event Location</h3>
              <p className="text-sm text-muted-foreground">
                {event.locationName}
                <br />
                {event.address}
                <br />
                {event.city}, {event.state} {event.zip}
              </p>
            </div>

            {/* Reminder */}
            {event.refundPolicyText && (
              <div className="text-xs text-muted-foreground">
                <strong>Refund Policy:</strong> {event.refundPolicyText}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={`/e/${event.slug}`}>
            <Button variant="outline">View Event Details</Button>
          </Link>
          <Link href="/events">
            <Button>Browse More Events</Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <p>© {new Date().getFullYear()} Paint & Sip Depot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
