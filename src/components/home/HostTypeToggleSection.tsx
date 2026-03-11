"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  {
    icon: CreditCard,
    title: "Payments",
    text: "Guests pay securely through Stripe Checkout during booking.",
  },
  {
    icon: BadgeCheck,
    title: "Setup",
    text: "Create events, publish links, and manage bookings from one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Operations",
    text: "Capacity limits, sales cutoffs, confirmations, and booking records stay in sync.",
  },
];

export function HostTypeToggleSection() {
  return (
    <section id="host-types" className="py-20 px-4 scroll-mt-28">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            How Hosting Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Run your events from one dashboard, accept payments through Stripe, and manage
            bookings without a separate payout onboarding flow.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="bg-card border rounded-3xl p-8 shadow-sm overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold">Host on one platform</h3>
                <p className="text-muted-foreground mt-2">
                  Create events, sell tickets, and track attendees in one place. Stripe powers
                  checkout, while this app handles scheduling, inventory, and guest management.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.title} className="rounded-2xl border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <p className="font-semibold">{item.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Start hosting with a standard account setup and Stripe-backed payments.
              </p>
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Become a Host
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
