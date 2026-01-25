"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface Canvas {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
] as const;

type Mode = "create" | "edit";

export type EventEditFormInitialData = {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  locationName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ticketPrice: string; // whole dollars as string
  capacity: string;
  salesCutoffHours: "48" | "72" | string;
  refundPolicyText: string;
  canvasImageUrl: string;
  canvasId?: string; // optional, for catalog selection
};

function isoToDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}
function isoToTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(11, 16);
}

export function EventEditForm({
  mode,
  eventId,
  ticketsSold = 0,
  showBackLink = true,
  backHref,
  titleText,
  subtitleText,
  initialData,
  initialStatus, // "DRAFT" | "PUBLISHED" etc (optional, used for button labels)
}: {
  mode: Mode;
  eventId?: string;
  ticketsSold?: number;
  showBackLink?: boolean;
  backHref: string; // e.g. "/dashboard/events"
  titleText: string; // e.g. "Create New Event" or "Edit Event"
  subtitleText?: string;
  initialData?: Partial<EventEditFormInitialData>;
  initialStatus?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<string>(initialData?.canvasId || "");
  const [imagePreview, setImagePreview] = useState<string>(initialData?.canvasImageUrl || "");

  const [formData, setFormData] = useState<EventEditFormInitialData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    startDate: initialData?.startDate ?? "",
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    locationName: initialData?.locationName ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    zip: initialData?.zip ?? "",
    ticketPrice: initialData?.ticketPrice ?? "30",
    capacity: initialData?.capacity ?? "50",
    salesCutoffHours: initialData?.salesCutoffHours ?? "48",
    refundPolicyText:
      initialData?.refundPolicyText ??
      "Full refunds available up to 72 hours before the event. 50% refund between 72-48 hours. No refunds within 48 hours of the event.",
    canvasImageUrl: initialData?.canvasImageUrl ?? "",
    canvasId: initialData?.canvasId ?? "",
  });

const [errors, setErrors] = useState<Record<string, string>>({});
const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

useEffect(() => {
  return () => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  };
}, [previewObjectUrl]);

const setFieldError = (field: string, message: string) =>
  setErrors((prev) => ({ ...prev, [field]: message }));

const clearFieldError = (field: string) =>
  setErrors((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });

  // Enforce min date: today + 7 days
  const minEventDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const minCapacity = useMemo(() => {
    // can't set capacity below tickets sold
    return Math.max(1, ticketsSold);
  }, [ticketsSold]);

  const ticketPriceLocked = useMemo(() => ticketsSold > 0, [ticketsSold]);

  useEffect(() => {
    fetch("/api/canvases")
      .then((res) => res.json())
      .then((data) => setCanvases(data.canvases || []))
      .catch(console.error);
  }, []);

  const handleCanvasSelect = (canvasId: string) => {
    setSelectedCanvas(canvasId);
    const canvas = canvases.find((c) => c.id === canvasId);
    if (!canvas) return;

    setFormData((prev) => ({
      ...prev,
      title: prev.title || canvas.name,
      canvasImageUrl: canvas.imageUrl,
      canvasId: canvas.id,
    }));
    setImagePreview(canvas.imageUrl);
  };

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // optional: keep client-side type/size checks too
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    toast({
      title: "Invalid file type",
      description: "Please upload a JPG, PNG, WEBP, or GIF.",
      variant: "destructive",
    });
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    toast({
      title: "File too large",
      description: "Maximum size is 5MB.",
      variant: "destructive",
    });
    return;
  }

  // clear catalog selection since we're using a custom upload
  setSelectedCanvas("");
  setFormData((prev) => ({
    ...prev,
    canvasId: "",
    canvasImageUrl: "", // clear old uploaded URL; we'll set it after upload on submit
  }));

  setPendingImageFile(file);

  // preview locally immediately (no upload yet)
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  const url = URL.createObjectURL(file);
  setPreviewObjectUrl(url);
  setImagePreview(url);

  toast({ title: "Image selected", description: "Will upload when you save/publish." });
};

  function normalizeWholeDollar(value: string) {
    // keep only digits, no decimals
    const digits = value.replace(/[^\d]/g, "");
    if (digits === "") return "";
    return String(parseInt(digits, 10));
  }

  const handleSubmit = async (e: React.FormEvent, action?: "draft" | "publish") => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // enforce min date client-side too (server will enforce again)
      setErrors({}); // clear old errors on submit

const isTooSoon = (() => {
  if (!formData.startDate) return false;
  const selected = new Date(`${formData.startDate}T00:00:00`);
  const min = new Date(`${minEventDate}T00:00:00`);
  return selected < min;
})();

if (isTooSoon) {
  setFieldError("startDate", `Event date must be on or after ${minEventDate}.`);
  setIsLoading(false);
  return;
}

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

      if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
        throw new Error("Please enter a valid date and time.");
      }

      // capacity rule
      const capacityInt = parseInt(formData.capacity, 10);
      if (Number.isNaN(capacityInt) || capacityInt < minCapacity) {
        throw new Error(`Capacity cannot be less than tickets sold (${minCapacity}).`);
      }

      // whole-dollar price
      const priceWhole = parseInt(formData.ticketPrice, 10);
      if (!ticketPriceLocked && (Number.isNaN(priceWhole) || priceWhole < 0)) {
        throw new Error("Ticket price must be a valid whole number.");
      }

      const payload: any = {
        ...formData,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        capacity: capacityInt,
        salesCutoffHours: parseInt(formData.salesCutoffHours, 10),
      };

      // Upload image only when saving/publishing
if (pendingImageFile) {
  setIsUploading(true);

  const uploadData = new FormData();
  uploadData.append("file", pendingImageFile);

  const uploadRes = await fetch("/api/upload", {
    method: "POST",
    body: uploadData,
  });

  if (!uploadRes.ok) {
    setIsUploading(false);
    throw new Error("Image upload failed. Please try again.");
  }

  const uploadJson = await uploadRes.json();

  payload.canvasImageUrl = uploadJson.url;
  payload.canvasId = undefined; // ensure not using catalog image

  // update UI state
  setPendingImageFile(null);
  setFormData((prev) => ({ ...prev, canvasImageUrl: uploadJson.url }));
  setImagePreview(uploadJson.url);

  setIsUploading(false);
}

      if (!ticketPriceLocked) {
        payload.ticketPriceCents = priceWhole * 100;
      }

      // only on create do we set status via action buttons
      if (mode === "create") {
        payload.status = action === "publish" ? "PUBLISHED" : "DRAFT";
        payload.canvasId = selectedCanvas || undefined;
      } else {
        // edit mode
        payload.canvasId = formData.canvasId || undefined;
      }

      const url = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const data = await res.json();

      if (mode === "create") {
        toast({
          title: action === "publish" ? "Event published!" : "Draft saved!",
          description:
            action === "publish"
              ? "Your event is now live and accepting bookings."
              : "You can publish it when ready.",
        });
        router.push(backHref);
router.refresh();
      } else {
        toast({
          title: "Saved",
          description: "Your changes were saved.",
        });
        router.push(backHref);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showBackLink ? (
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{titleText}</h1>
          {subtitleText ? (
            <p className="text-muted-foreground mt-1">{subtitleText}</p>
          ) : null}
          {mode === "edit" && ticketsSold > 0 ? (
            <p className="text-xs text-muted-foreground mt-2">
              Ticket price is locked because {ticketsSold} ticket(s) have been purchased.
            </p>
            
          ) : null}
        </div>

        <form className="space-y-6" onSubmit={(e) => handleSubmit(e, mode === "create" ? "draft" : undefined)}>
          {/* Canvas Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Canvas</CardTitle>
              <CardDescription>
                Select a canvas from the catalog or upload your own image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canvases.length > 0 && (
                <div>
                  <Label>Select from Catalog</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-2">
                    {canvases.map((canvas) => (
                      <button
                        key={canvas.id}
                        type="button"
                        onClick={() => handleCanvasSelect(canvas.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedCanvas === canvas.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <Image src={canvas.imageUrl} alt={canvas.name} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Label>Or Upload Custom Image</Label>
                <div className="mt-2">
                  {imagePreview && !selectedCanvas ? (
                    <div className="relative w-48 aspect-square rounded-lg overflow-hidden border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setFormData((prev) => ({ ...prev, canvasImageUrl: "", canvasId: "" }));
                        }}
                        className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-48 aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload image</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Starry Night Wine Evening"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what guests can expect..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={minEventDate}
                    value={formData.startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, startDate: value });

                      if (value && value < minEventDate) {
                        setFieldError(
                          "startDate",
                          "Event date must be at least 7 days from today."
                        );
                      } else {
                        clearFieldError("startDate");
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Events must be scheduled at least 7 days in advance.
                  </p>
                  {errors.startDate ? (
    <p className="text-xs text-destructive mt-1">{errors.startDate}</p>
  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locationName">Venue Name</Label>
                <Input
                  id="locationName"
                  placeholder="e.g., The Art Loft Studio"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Austin"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="78701"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets & Capacity */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets & Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price ($)</Label>
                  <Input
                    id="ticketPrice"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="30"
                    value={formData.ticketPrice}
                    onChange={(e) => {
                      const next = normalizeWholeDollar(e.target.value);
                      setFormData({ ...formData, ticketPrice: next });
                    }}
                    disabled={ticketPriceLocked}
                    aria-disabled={ticketPriceLocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={String(minCapacity)}
                    placeholder="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                  {ticketsSold > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Cannot be less than tickets sold ({ticketsSold}).
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesCutoffHours">Sales Cutoff (hours before event)</Label>
                <Select
                  value={formData.salesCutoffHours}
                  onValueChange={(value) => setFormData({ ...formData, salesCutoffHours: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Refund Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Policy</CardTitle>
              <CardDescription>This will be displayed to guests during checkout</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.refundPolicyText}
                onChange={(e) => setFormData({ ...formData, refundPolicyText: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>
{Object.keys(errors).length > 0 ? (
  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
    <p className="text-sm text-destructive">
      {errors[Object.keys(errors)[0]]}
    </p>
  </div>
) : null}
          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            {mode === "create" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e as any, "draft")}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e as any, "publish")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Publish Event"
                  )}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}