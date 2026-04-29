"use client";

import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function HostKitBanner({
  eventId,
  eventTitle,
  cutoffDate,
}: {
  eventId: string;
  eventTitle: string;
  cutoffDate: string;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function buyKit() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/host-kit-checkout`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Buy your kit for {eventTitle}</p>
            <p className="text-sm text-muted-foreground">
              Purchase your host kit before checkout closes on {cutoffDate}.
            </p>
          </div>
        </div>
        <Button onClick={buyKit} disabled={isLoading} className="shrink-0">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
          Buy your kit
        </Button>
      </div>
    </div>
  );
}
