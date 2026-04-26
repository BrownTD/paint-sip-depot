"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Mail, PackageCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type ActionName = "buy-label" | "fulfill" | "tracking-email";

function splitExternalLinks(value: string | null) {
  return value?.split(",").map((link) => link.trim()).filter(Boolean) ?? [];
}

function isUsableSignedShippoUrl(value: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.searchParams.has("Key-Pair-Id") || url.searchParams.has("AWSAccessKeyId");
  } catch {
    return false;
  }
}

export function AdminShippingActions({
  orderId,
  labelUrl,
  trackingNumber,
  trackingUrl,
  qrCodeUrl,
  packingSlipUrl,
  shippoRateId,
  status,
}: {
  orderId: string;
  labelUrl: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  qrCodeUrl: string | null;
  packingSlipUrl: string | null;
  shippoRateId: string | null;
  status: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState<ActionName | null>(null);
  const [isPending, startTransition] = useTransition();
  const labelUrls = splitExternalLinks(labelUrl);
  const trackingUrls = splitExternalLinks(trackingUrl);
  const hasUsableQrCode = isUsableSignedShippoUrl(qrCodeUrl);
  const isBusy = Boolean(pendingAction) || isPending;

  async function runAction(action: ActionName) {
    if (action === "buy-label") {
      const confirmed = window.confirm(
        "Buy a Shippo shipping label for this order? In live mode this can charge your Shippo account.",
      );
      if (!confirmed) return;
    }

    setPendingAction(action);

    try {
      const response = await fetch(`/api/admin/shop-orders/${orderId}/${action}`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Shipping action failed.");
      }

      toast({
        title:
          action === "buy-label"
            ? "Label purchased"
            : action === "fulfill"
              ? "Order marked fulfilled"
              : "Tracking email sent",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      toast({
        title: "Shipping action failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {labelUrls.map((url, index) => (
          <Button key={url} asChild size="sm" variant="outline">
            <a href={url} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              {labelUrls.length > 1 ? `Download label ${index + 1}` : "Download label"}
            </a>
          </Button>
        ))}
        {trackingUrls.map((url, index) => (
          <Button key={url} asChild size="sm" variant="outline">
            <a href={url} target="_blank" rel="noreferrer">
              Track package{trackingUrls.length > 1 ? ` ${index + 1}` : ""}
            </a>
          </Button>
        ))}
        {hasUsableQrCode ? (
          <Button asChild size="sm" variant="outline">
            <a href={qrCodeUrl ?? undefined} target="_blank" rel="noreferrer">
              QR code
            </a>
          </Button>
        ) : null}
        {packingSlipUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={packingSlipUrl} target="_blank" rel="noreferrer">
              Packing slip
            </a>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => runAction("buy-label")}
          disabled={isBusy || Boolean(labelUrl) || !shippoRateId}
        >
          {pendingAction === "buy-label" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Tag className="mr-2 h-4 w-4" />
          )}
          Buy label
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => runAction("fulfill")}
          disabled={isBusy || status === "FULFILLED"}
        >
          {pendingAction === "fulfill" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="mr-2 h-4 w-4" />
          )}
          Mark as fulfilled
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => runAction("tracking-email")}
          disabled={isBusy || !trackingNumber}
        >
          {pendingAction === "tracking-email" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Resend tracking email
        </Button>
      </div>
    </div>
  );
}
