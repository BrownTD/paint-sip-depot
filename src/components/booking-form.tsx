"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCheckoutTotalCents } from "@/lib/checkout-pricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { formatAmountForDisplay } from "@/lib/money";
import { getGroundAdvantageLabel } from "@/lib/shipping-display";

interface BookingFormProps {
  eventId: string;
  maxQuantity: number;
  ticketPrice: number;
  fulfillmentMethod: "SHIP_TO_HOST" | "PICKUP";
}

export function BookingForm({ eventId, maxQuantity, ticketPrice, fulfillmentMethod }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState<{
    amountCents: number;
    service: string | null;
    estimateLabel: string | null;
  } | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const pricing = getCheckoutTotalCents(ticketPrice, quantity, { includeShipping: false });
  const shippingCents = shippingEstimate?.amountCents ?? 0;
  const totalBeforeTaxCents = pricing.totalCents + shippingCents;

  useEffect(() => {
    if (fulfillmentMethod !== "SHIP_TO_HOST") {
      setShippingEstimate(null);
      return;
    }

    let isCanceled = false;
    setIsLoadingShipping(true);

    fetch(`/api/events/${eventId}/shipping-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load shipping.");
        if (!isCanceled) {
          setShippingEstimate({
            amountCents: data.amountCents ?? 0,
            service: data.service ?? null,
            estimateLabel: data.estimateLabel ?? null,
          });
        }
      })
      .catch(() => {
        if (!isCanceled) setShippingEstimate(null);
      })
      .finally(() => {
        if (!isCanceled) setIsLoadingShipping(false);
      });

    return () => {
      isCanceled = true;
    };
  }, [eventId, fulfillmentMethod, quantity]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(maxQuantity, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          quantity,
          purchaserName: formData.name,
          purchaserEmail: formData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quantity Selector */}
      <div>
        <Label className="text-sm">Number of Tickets</Label>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxQuantity}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {maxQuantity > 0 && maxQuantity < 10 && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            {maxQuantity} ticket{maxQuantity === 1 ? "" : "s"} remaining
          </p>
        )}
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <Separator />

      {/* Total */}
      <div className="space-y-3 py-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tickets</span>
          <span>{formatAmountForDisplay(pricing.subtotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Processing Fee</span>
          <span>{formatAmountForDisplay(pricing.processingFeeCents)}</span>
        </div>
        {fulfillmentMethod === "SHIP_TO_HOST" ? (
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-foreground">
                {isLoadingShipping ? "Loading shipping..." : `${getGroundAdvantageLabel(shippingEstimate?.service)}:`}
              </span>
              <span className="font-medium">{formatAmountForDisplay(shippingCents)}</span>
            </div>
            {shippingEstimate?.estimateLabel ? (
              <p className="mt-1 text-base font-medium text-foreground">{shippingEstimate.estimateLabel}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Taxes</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="font-medium">Total before tax</span>
          <span className="text-xl font-bold">{formatAmountForDisplay(totalBeforeTaxCents)}</span>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirecting...
          </>
        ) : (
          <span className="inline-flex items-center gap-2.5">
            Continue with
            <Image
              src="/Misc/Stripe wordmark - White.svg"
              alt="Stripe"
              width={72}
              height={30}
              className="h-5 w-auto"
            />
          </span>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You&apos;ll be redirected to complete payment securely via Stripe
      </p>
    </form>
  );
}
