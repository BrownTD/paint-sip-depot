"use client";

import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function EventShareCard({
  eventCode,
  visibility,
}: {
  eventCode: string | null;
  visibility: "PUBLIC" | "PRIVATE";
}) {
  if (visibility !== "PRIVATE" || !eventCode) {
    return null;
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventCode);
      toast({
        title: "Copied to clipboard",
        description: "Share with participants.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the event code.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Share2 className="h-3.5 w-3.5" />
            Event Code
          </div>
          <div className="text-2xl font-semibold tracking-[0.2em] text-foreground">
            {eventCode}
          </div>
        <p className="text-sm text-muted-foreground">
  Share this <span className="font-semibold text-foreground">code</span> with guests so they can quickly find your <span className="font-semibold text-foreground">private event</span>.
</p>
        </div>

        <Button type="button" variant="outline" className="rounded-full px-5" onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Code
        </Button>
      </div>
    </div>
  );
}
