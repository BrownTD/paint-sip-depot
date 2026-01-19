"use client";

import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { formatAmountForDisplay } from "@/lib/money";

interface BookingFormProps {
  eventId: string;
  maxQuantity: number;
  ticketPrice: number;
}

export function BookingForm({ eventId, maxQuantity, ticketPrice }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const total = ticketPrice * quantity;

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
        {maxQuantity < 10 && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Max {maxQuantity} per order
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
      <div className="flex items-center justify-between py-2">
        <span className="font-medium">Total</span>
        <span className="text-xl font-bold">{formatAmountForDisplay(total)}</span>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Book Now"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You&apos;ll be redirected to complete payment securely via Stripe
      </p>
    </form>
  );
}