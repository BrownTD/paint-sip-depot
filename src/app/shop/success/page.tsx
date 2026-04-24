import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ShopOrderStatus } from "@prisma/client";
import Stripe from "stripe";
import { CheckCircle2, Package2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrencyAmount } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Shop Order Confirmed",
};

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

async function getOrderDetails(sessionId: string) {
  const stripe = getStripeClient();
  if (!stripe) {
    return null;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session || session.payment_status !== "paid") {
    return null;
  }

  const order = await prisma.shopOrder.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  if (order.status === ShopOrderStatus.PENDING) {
    await prisma.shopOrder.update({
      where: { id: order.id },
      data: {
        status: ShopOrderStatus.PAID,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    });
  }

  return {
    session,
    order,
  };
}

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  if (!searchParams.session_id) {
    redirect("/shop");
  }

  const result = await getOrderDetails(searchParams.session_id);
  if (!result) {
    redirect("/shop");
  }

  const { order } = result;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4">
          <Link href="/shop" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Package2 className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">Paint &amp; Sip Depot</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold">Order Confirmed</h1>
          <p className="mt-2 text-muted-foreground">
            Your shop order has been paid successfully.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Order placed {formatDate(order.createdAt)}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {item.imageUrlSnapshot ? (
                      <img
                        src={item.imageUrlSnapshot}
                        alt={item.productNameSnapshot}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productNameSnapshot}</p>
                    {item.colorLabelSnapshot ? (
                      <p className="text-sm text-muted-foreground">Color: {item.colorLabelSnapshot}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{item.variantLabelSnapshot}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right text-sm font-medium">
                    {formatCurrencyAmount(item.totalPriceCents, item.currency)}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">Customer</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {order.customerName}
                <br />
                {order.customerEmail}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrencyAmount(order.amountSubtotalCents, order.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Total Paid</span>
                <span className="text-xl font-bold">
                  {formatCurrencyAmount(order.amountTotalCents, order.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild>
            <Link href="/">Back to Homepage</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
