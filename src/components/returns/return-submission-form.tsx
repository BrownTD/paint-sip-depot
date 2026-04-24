"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const issueTypes = ["Damaged item", "Wrong order", "Shipping error", "Other"] as const;

export function ReturnSubmissionForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [issueType, setIssueType] = useState<(typeof issueTypes)[number] | "">("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

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
        <Input id="phoneNumber" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
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
          disabled={isUploading || photoUrls.length >= 6}
        >
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Photo
        </Button>
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
  );
}
