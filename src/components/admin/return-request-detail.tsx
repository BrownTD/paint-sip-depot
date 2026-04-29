"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type ReturnRequestDetailProps = {
  submission: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    phoneNumber: string | null;
    issueType: string;
    description: string;
    photoUrls: string[];
    didNotReceiveOrder: boolean;
    status: string;
    decisionReason: string | null;
    customerMessage: string | null;
    resolutionType: string | null;
    refundAmountCents: number | null;
    replacementOrderId: string | null;
    returnLabelUrl: string | null;
    returnLabelTrackingUrl: string | null;
    returnLabelTrackingNumber: string | null;
    customerNotifiedAt: string | null;
    resolvedAt: string | null;
    createdAt: string;
  };
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    shippingName: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingZip: string | null;
    shippingPhone: string | null;
    status: string;
    currency: string;
    amountSubtotalCents: number;
    amountTotalCents: number;
    shippingAmountCents: number;
    stripePaymentIntentId: string | null;
    createdAt: string;
    items: Array<{
      id: string;
      productNameSnapshot: string;
      variantLabelSnapshot: string;
      colorLabelSnapshot: string | null;
      quantity: number;
      unitPriceCents: number;
      totalPriceCents: number;
      currency: string;
    }>;
  } | null;
  replacementOrder: {
    id: string;
    status: string;
  } | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function getStatusVariant(status: string) {
  if (status.startsWith("APPROVED")) return "success";
  if (status === "DENIED") return "destructive";
  return "secondary";
}

export function ReturnRequestDetail({
  submission,
  order,
  replacementOrder,
}: ReturnRequestDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [decision, setDecision] = useState<"APPROVED" | "DENIED">(
    submission.status === "DENIED" ? "DENIED" : "APPROVED",
  );
  const [resolutionType, setResolutionType] = useState<"REFUND" | "REPLACEMENT">(
    submission.resolutionType === "REPLACEMENT" ? "REPLACEMENT" : "REFUND",
  );
  const [decisionReason, setDecisionReason] = useState(submission.decisionReason ?? "");
  const [customerMessage, setCustomerMessage] = useState(submission.customerMessage ?? "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [createReturnLabel, setCreateReturnLabel] = useState(
    Boolean(!submission.didNotReceiveOrder && order?.shippingAddress),
  );
  const [refundAmount, setRefundAmount] = useState(
    order ? String((submission.refundAmountCents ?? order.amountTotalCents) / 100) : "",
  );
  const [replacementItems, setReplacementItems] = useState(
    order?.items.map((item) => ({ orderItemId: item.id, quantity: item.quantity })) ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResolved = Boolean(submission.resolvedAt);
  const canCreateReturnLabel = Boolean(!submission.didNotReceiveOrder && order?.shippingAddress);
  const replacementQuantityTotal = useMemo(
    () => replacementItems.reduce((sum, item) => sum + item.quantity, 0),
    [replacementItems],
  );

  async function handleSubmit() {
    if (isResolved) {
      return;
    }

    if (decision === "APPROVED" && !order) {
      toast({
        title: "Order not found",
        description: "A matching shop order is required to approve this request.",
        variant: "destructive",
      });
      return;
    }

    if (decision === "APPROVED" && resolutionType === "REPLACEMENT" && replacementQuantityTotal <= 0) {
      toast({
        title: "No replacement items",
        description: "Set at least one replacement quantity greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const refundAmountCents =
        decision === "APPROVED" && resolutionType === "REFUND" && refundAmount
          ? Math.round(Number.parseFloat(refundAmount) * 100)
          : null;

      const response = await fetch(`/api/admin/returns/${submission.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          resolutionType: decision === "APPROVED" ? resolutionType : null,
          decisionReason,
          customerMessage,
          notifyCustomer,
          createReturnLabel: decision === "APPROVED" ? createReturnLabel : false,
          refundAmountCents,
          replacementItems,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to process return request.");
      }

      toast({
        title: "Return request updated",
        description: data.warning || "The return request was processed successfully.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusVariant(submission.status)}>{submission.status}</Badge>
            <Badge variant="outline">{submission.issueType}</Badge>
            {submission.didNotReceiveOrder ? <Badge variant="outline">Not received</Badge> : null}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">Return Request {submission.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {formatDateTime(submission.createdAt)} for order {submission.orderNumber}
          </p>
        </div>
        {replacementOrder ? (
          <Button asChild variant="outline">
            <Link href={`/admin/shipping/${replacementOrder.id}`}>Open replacement order</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">{submission.customerName}</p>
                <Link href={`mailto:${submission.customerEmail}`} className="text-muted-foreground hover:underline">
                  {submission.customerEmail}
                </Link>
                {submission.phoneNumber ? <p className="text-muted-foreground">{submission.phoneNumber}</p> : null}
              </div>
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/30 p-4 leading-6 text-muted-foreground">
                  {submission.description}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Photos</p>
                {submission.photoUrls.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {submission.photoUrls.map((url, index) => (
                      <Link
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border p-3 text-sm hover:bg-muted/30"
                      >
                        <span>Photo {index + 1}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">No photos uploaded.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Original Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Status</p>
                      <p className="mt-1">{order.status}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Placed</p>
                      <p className="mt-1">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Paid total</p>
                      <p className="mt-1">{formatCurrency(order.amountTotalCents, order.currency)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Stripe payment intent</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {order.stripePaymentIntentId || "Not available"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-muted-foreground">Ship to</p>
                      <p className="mt-1">
                        {[
                          order.shippingName,
                          order.shippingAddress,
                          [order.shippingCity, order.shippingState, order.shippingZip].filter(Boolean).join(", "),
                        ]
                          .filter(Boolean)
                          .join(" | ") || "No shipping address saved"}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                      <thead>
                        <tr className="border-b text-left text-sm text-muted-foreground">
                          <th className="px-4 py-3">Item</th>
                          <th className="px-4 py-3">Options</th>
                          <th className="px-4 py-3 text-right">Qty</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">{item.productNameSnapshot}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {[item.variantLabelSnapshot !== "Standard" ? item.variantLabelSnapshot : null, item.colorLabelSnapshot]
                                .filter(Boolean)
                                .join(" | ") || "Standard"}
                            </td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(item.totalPriceCents, item.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No matching shop order was found for this request. You can still deny the request, but approval actions need an order record.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={decision === "APPROVED" ? "default" : "outline"}
                  disabled={isResolved}
                  onClick={() => setDecision("APPROVED")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={decision === "DENIED" ? "default" : "outline"}
                  disabled={isResolved}
                  onClick={() => setDecision("DENIED")}
                >
                  Deny
                </Button>
              </div>

              {decision === "APPROVED" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={resolutionType === "REFUND" ? "default" : "outline"}
                    disabled={isResolved || !order?.stripePaymentIntentId}
                    onClick={() => setResolutionType("REFUND")}
                  >
                    Refund
                  </Button>
                  <Button
                    type="button"
                    variant={resolutionType === "REPLACEMENT" ? "default" : "outline"}
                    disabled={isResolved || !order}
                    onClick={() => setResolutionType("REPLACEMENT")}
                  >
                    Resend products
                  </Button>
                </div>
              ) : null}

              {decision === "APPROVED" && resolutionType === "REFUND" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="refundAmount">
                    Refund Amount
                  </label>
                  <Input
                    id="refundAmount"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    disabled={isResolved}
                    inputMode="decimal"
                  />
                </div>
              ) : null}

              {decision === "APPROVED" && resolutionType === "REPLACEMENT" && order ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Replacement Quantities</p>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={item.id} className="rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.productNameSnapshot}</p>
                            <p className="text-sm text-muted-foreground">
                              {[item.variantLabelSnapshot !== "Standard" ? item.variantLabelSnapshot : null, item.colorLabelSnapshot]
                                .filter(Boolean)
                                .join(" | ") || "Standard"}
                            </p>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            className="w-24"
                            value={replacementItems[index]?.quantity ?? 0}
                            disabled={isResolved}
                            onChange={(event) => {
                              const next = [...replacementItems];
                              next[index] = {
                                orderItemId: item.id,
                                quantity: Math.max(0, Number.parseInt(event.target.value || "0", 10) || 0),
                              };
                              setReplacementItems(next);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="decisionReason">
                  Reason
                </label>
                <Textarea
                  id="decisionReason"
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                  disabled={isResolved}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="customerMessage">
                  Customer Message
                </label>
                <Textarea
                  id="customerMessage"
                  value={customerMessage}
                  onChange={(event) => setCustomerMessage(event.target.value)}
                  disabled={isResolved}
                  rows={4}
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={notifyCustomer}
                  disabled={isResolved}
                  onChange={(event) => setNotifyCustomer(event.target.checked)}
                />
                <span>
                  Email the customer with this decision.
                  {submission.customerNotifiedAt ? (
                    <span className="block text-muted-foreground">
                      Last sent {formatDateTime(submission.customerNotifiedAt)}
                    </span>
                  ) : null}
                </span>
              </label>

              {decision === "APPROVED" ? (
                <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={createReturnLabel}
                    disabled={isResolved || !canCreateReturnLabel}
                    onChange={(event) => {
                      setCreateReturnLabel(event.target.checked);
                      if (event.target.checked) {
                        setNotifyCustomer(true);
                      }
                    }}
                  />
                  <span>
                    Create a return label and include it in the customer email.
                    {!canCreateReturnLabel ? (
                      <span className="block text-muted-foreground">
                        A return label needs the original shipping address and is unavailable for not-received claims.
                      </span>
                    ) : null}
                  </span>
                </label>
              ) : null}

              {submission.returnLabelUrl ? (
                <div className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">Existing return label</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={submission.returnLabelUrl} target="_blank" rel="noreferrer">
                        Download label
                      </Link>
                    </Button>
                    {submission.returnLabelTrackingUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={submission.returnLabelTrackingUrl} target="_blank" rel="noreferrer">
                          Track return
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {isResolved ? (
                <p className="text-sm text-muted-foreground">
                  This request was resolved {submission.resolvedAt ? formatDateTime(submission.resolvedAt) : ""}.
                </p>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Decision
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
