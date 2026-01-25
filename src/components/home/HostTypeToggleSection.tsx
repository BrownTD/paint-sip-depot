"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type HostMode = "INDIVIDUAL" | "ORG";

export function HostTypeToggleSection() {
  const [mode, setMode] = useState<HostMode>("INDIVIDUAL");

  const content = useMemo(() => {
    if (mode === "INDIVIDUAL") {
      return {
        eyebrowIcon: User,
        title: "Individual Host",
        subtitle:
          "Best for creators and individuals hosting paint nights, birthdays, team events, and private sessions.",
        bullets: [
          {
            icon: CreditCard,
            title: "Payments",
            text: "Ticket payments route to Paint & Sip Depot. No payout setup required.",
          },
          {
            icon: BadgeCheck,
            title: "Setup",
            text: "Create events, share links, and manage bookings instantly.",
          },
          {
  icon: ShieldCheck,
  title: "Simple + fast",
  text: "You get the tools (ticketing, confirmations, capacity). We handle the payment plumbing.",
},
        ],
        footnote:
          "Want payouts to your own account? Request Organization Host access during onboarding.",
      };
    }

    return {
      eyebrowIcon: Building2,
      title: "Organization Host",
      subtitle:
        "For approved organizations that want payouts to their own account via Stripe Connect. This is a gated feature.",
      bullets: [
        {
          icon: ShieldCheck,
          title: "Approval + onboarding",
          text: "Request access → review → complete Stripe onboarding to enable payouts.",
        },
        {
          icon: CreditCard,
          title: "Fee split",
          text: "Paint & Sip Depot keeps $15 per ticket payment as an application fee. The remainder is paid out to the host account.",
        },
        {
          icon: BadgeCheck,
          title: "Refunds & fees",
          text: "Refunds and Stripe processing fees come from the host’s connected account.",
        },
      ],
      footnote:
        "Until approved + onboarded, payments still route to Paint & Sip Depot.",
    };
  }, [mode]);

  const EyebrowIcon = content.eyebrowIcon;

  return (
    <section id="host-types" className="py-20 px-4 scroll-mt-28">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Understand Host Types
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Events are shared via host link. This platform is built for hosts—and how money
            flows depends on your host type.
          </p>
        </div>

        {/* iOS-style glass toggle (black bg, white text, white pill w/ black text) */}
        <div className="flex justify-center mb-10">
          <div
  className={[
    "relative w-full max-w-md rounded-2xl p-1 overflow-hidden",
    "bg-black/80 text-white",
    "backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
  ].join(" ")}
>
  {/* moving pill (never overshoots) */}
  <div
    className={[
      "absolute top-1 bottom-1 left-1 rounded-xl",
      "bg-white shadow-sm",
      // pill width = half minus the gap created by left/right padding (2px each side of the inner grid)
      "w-[calc(50%-4px)]",
      "transition-transform duration-300 ease-out",
      mode === "ORG" ? "translate-x-full" : "translate-x-0",
    ].join(" ")}
  />

            <div className="relative grid grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("INDIVIDUAL")}
                className={[
                  "h-12 rounded-xl font-medium",
                  "transition-colors duration-300",
                  mode === "INDIVIDUAL"
                    ? "text-black"
                    : "text-white/90 hover:text-white",
                ].join(" ")}
                aria-pressed={mode === "INDIVIDUAL"}
              >
                Individual
              </button>

              <button
                type="button"
                onClick={() => setMode("ORG")}
                className={[
                  "h-12 rounded-xl font-medium",
                  "transition-colors duration-300",
                  mode === "ORG" ? "text-black" : "text-white/90 hover:text-white",
                ].join(" ")}
                aria-pressed={mode === "ORG"}
              >
                Organization
              </button>
            </div>
          </div>
        </div>

        {/* Single swapping card */}
        <div className="mx-auto max-w-3xl">
          <div className="bg-card border rounded-3xl p-8 shadow-sm overflow-hidden">
            {/* header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <EyebrowIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl font-semibold">{content.title}</h3>
                </div>
                <p className="text-muted-foreground mt-2">{content.subtitle}</p>
              </div>
            </div>

            {/* animated body swap */}
            <div className="relative">
              <div
                key={mode}
                className="animate-[fadeSwap_.28s_ease-out]"
              >
                <div className="grid md:grid-cols-3 gap-4">
                  {content.bullets.map((b, idx) => (
                    <div key={idx} className="rounded-2xl border p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <b.icon className="w-5 h-5 text-primary" />
                        <p className="font-semibold">{b.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{b.text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mt-5">{content.footnote}</p>
              </div>
            </div>

            {/* CTA always visible */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                You can request organization payouts during onboarding.
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

      {/* tiny keyframes for swap */}
      <style jsx>{`
        @keyframes fadeSwap {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}