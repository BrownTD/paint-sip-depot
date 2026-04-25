"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyAmount } from "@/lib/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const issueTypes = ["Damaged item", "Wrong order", "Shipping error", "Other"] as const;

type LookupOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  amountTotalCents: number;
  currency: string;
  items: Array<{
    id: string;
    productName: string;
    variantLabel: string;
    colorLabel: string | null;
    quantity: number;
  }>;
};

export function ReturnSubmissionForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupOrders, setLookupOrders] = useState<LookupOrder[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [issueType, setIssueType] = useState<(typeof issueTypes)[number] | "">("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [didNotReceiveOrder, setDidNotReceiveOrder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  async function handleOrderSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/returns/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search orders.");
      }

      setLookupOrders(data.orders || []);
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search orders.",
        variant: "destructive",
      });
      setLookupOrders([]);
    } finally {
      setIsSearching(false);
    }
  }

  function selectOrder(order: LookupOrder) {
    setOrderNumber(order.id);
    setCustomerName(order.customerName);
    setCustomerEmail(order.customerEmail);
    setLookupEmail(order.customerEmail);
    toast({
      title: "Order selected",
      description: "The return form was filled with this order's details.",
    });
  }

  async function handleUpload(file: File) {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/returns/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo.");
      }

      setPhotoUrls((current) => [...current, data.url].slice(0, 6));
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!didNotReceiveOrder && photoUrls.length === 0) {
      toast({
        title: "Photo required",
        description: "Upload at least one photo or select I didn't receive this order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          customerName,
          customerEmail,
          phoneNumber,
          issueType,
          description,
          photoUrls,
          didNotReceiveOrder,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit return request.");
      }

      setSubmittedId(data.id);
      setOrderNumber("");
      setCustomerName("");
      setCustomerEmail("");
      setPhoneNumber("");
      setIssueType("");
      setDescription("");
      setPhotoUrls([]);
      setDidNotReceiveOrder(false);
      toast({
        title: "Return request submitted",
        description: "We received your request and will review it shortly.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit return request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <div className="rounded-2xl border bg-muted/30 p-6 text-center">
        <h2 className="font-display text-2xl font-semibold">Request submitted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your return request ID is <span className="font-medium text-foreground">{submittedId}</span>.
          We&apos;ll review your information and contact you by email.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => setSubmittedId(null)}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form className="space-y-3" onSubmit={handleOrderSearch}>
        <Label htmlFor="orderSearchEmail">Search order by email</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="orderSearchEmail"
            type="email"
            placeholder="Search order by email"
            value={lookupEmail}
            onChange={(event) => setLookupEmail(event.target.value)}
            required
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Search
          </Button>
        </div>
        {hasSearched ? (
          <div className="space-y-3">
            {lookupOrders.length > 0 ? (
              lookupOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => selectOrder(order)}
                  className="w-full rounded-2xl border bg-background p-4 text-left transition hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">Order {order.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrencyAmount(order.amountTotalCents, order.currency)}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {order.items
                      .map((item) => `${item.quantity} x ${item.productName}`)
                      .join(", ")}
                  </p>
                </button>
              ))
            ) : (
              <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                No paid shop orders were found for that email.
              </p>
            )}
          </div>
        ) : null}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Return Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orderNumber">Order Number</Label>
          <Input id="orderNumber" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Issue Type</Label>
          <Select value={issueType} onValueChange={(value) => setIssueType(value as (typeof issueTypes)[number])} required>
            <SelectTrigger>
              <SelectValue placeholder="Choose an issue" />
            </SelectTrigger>
            <SelectContent>
              {issueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">Name</Label>
          <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input id="customerEmail" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description of Issue</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell us what happened and include details about the item and packaging."
          rows={6}
          required
        />
      </div>

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || photoUrls.length >= 6 || didNotReceiveOrder}
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Photo
        </Button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={didNotReceiveOrder}
            onChange={(event) => {
              setDidNotReceiveOrder(event.target.checked);
              if (event.target.checked) {
                setPhotoUrls([]);
              }
            }}
            className="h-4 w-4 rounded border-border"
          />
          I didn&apos;t receive this order.
        </label>
        {photoUrls.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {photoUrls.map((url) => (
              <div key={url} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <a href={url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                  {url}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPhotoUrls((current) => current.filter((item) => item !== url))}
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit Return Request
      </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
