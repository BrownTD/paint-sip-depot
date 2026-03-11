"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function EventCodeCopyButton({ eventCode }: { eventCode: string }) {
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
    <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={onCopy}>
      <Copy className="h-4 w-4" />
      {eventCode}
    </Button>
  );
}
