"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Images, Loader2, Upload, X } from "lucide-react";

import type { CanvasGalleryItem, CanvasGallerySection } from "@/lib/canvas-gallery";
import { CanvasGalleryDialog } from "@/components/events/canvas-gallery-dialog";
import { dateTimeInZoneToIso, formatDateInputValue, formatTimeInputValue } from "@/lib/utils";
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

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
] as const;

const FIXED_TICKET_PRICE_DOLLARS = "35";
const FIXED_TICKET_PRICE_CENTS = 3500;
const FIXED_REFUND_POLICY =
  "Refunds are not available within 7 days of the event due to preparation and supply costs.\n\nIf you are unable to attend, your pre-drawn canvas and materials can be shipped to you so you can still complete the painting at home. Shipping fees may apply.\n\nIf the event is canceled by the organizer, all pre-drawn canvases and materials will be shipped to guests so they can still complete the painting at home. Guests will be contacted with additional details if necessary.";
const DEFAULT_EVENT_DESCRIPTION =
  "Join us for a fun creative Paint & Sip experience! Each guest will receive a pre-drawn canvas design, making it easy for anyone to paint — no experience required. Simply follow the outlines, add your own colors, and enjoy the creative process.\n\nAll painting supplies are included. Bring friends, enjoy the atmosphere, and leave with a finished canvas you'll be proud of!";

type Mode = "create" | "edit";

export type EventEditFormInitialData = {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  visibility: "PUBLIC" | "PRIVATE";
  eventFormat: "IN_PERSON" | "VIRTUAL";
  locationName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ticketPrice: string; // whole dollars as string
  capacity: string;
  refundPolicyText: string;
  canvasImageUrl: string;
  canvasName?: string;
};

function isoToDate(iso?: string | null) {
  return formatDateInputValue(iso);
}
function isoToTime(iso?: string | null) {
  return formatTimeInputValue(iso);
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
  canvasSections,
  initialStatus, // "DRAFT" | "PUBLISHED" etc (optional, used for button labels)
  submitButtonLabel,
  publishOnSubmit = false,
}: {
  mode: Mode;
  eventId?: string;
  ticketsSold?: number;
  showBackLink?: boolean;
  backHref: string; // e.g. "/dashboard/events"
  titleText: string; // e.g. "Create New Event" or "Edit Event"
  subtitleText?: string;
  initialData?: Partial<EventEditFormInitialData>;
  canvasSections: CanvasGallerySection[];
  initialStatus?: string;
  submitButtonLabel?: string;
  publishOnSubmit?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const previewCanvases = useMemo(
    () => canvasSections.flatMap((section) => section.items).slice(0, 5),
    [canvasSections]
  );
  const canvasLookup = useMemo(() => {
    const entries = canvasSections.flatMap((section) => section.items.map((item) => [item.id, item] as const));
    return new Map(entries);
  }, [canvasSections]);
  const initialSelectedCanvasId = useMemo(() => {
    return (
      canvasSections
        .flatMap((section) => section.items)
        .find(
          (item) =>
            item.imageUrl === initialData?.canvasImageUrl ||
            (initialData?.canvasName && item.name === initialData.canvasName)
        )?.id ?? ""
    );
  }, [canvasSections, initialData?.canvasImageUrl, initialData?.canvasName]);
  const [selectedCanvas, setSelectedCanvas] = useState<string>(initialSelectedCanvasId);
  const [pendingCanvasId, setPendingCanvasId] = useState<string>(initialSelectedCanvasId);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.canvasImageUrl || "");

  const [formData, setFormData] = useState<EventEditFormInitialData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? DEFAULT_EVENT_DESCRIPTION,
    startDate: initialData?.startDate ?? "",
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    visibility: initialData?.visibility ?? "PRIVATE",
    eventFormat: initialData?.eventFormat ?? "IN_PERSON",
    locationName: initialData?.locationName ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    zip: initialData?.zip ?? "",
    ticketPrice: FIXED_TICKET_PRICE_DOLLARS,
    capacity: initialData?.capacity ?? "50",
    refundPolicyText: FIXED_REFUND_POLICY,
    canvasImageUrl: initialData?.canvasImageUrl ?? "",
    canvasName: initialData?.canvasName ?? "",
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
    return formatDateInputValue(d);
  }, []);

  const minCapacity = useMemo(() => {
    // can't set capacity below tickets sold
    return Math.max(1, ticketsSold);
  }, [ticketsSold]);

  const openCanvasGallery = (canvasId?: string) => {
    setPendingCanvasId(canvasId || selectedCanvas || initialSelectedCanvasId);
    setIsGalleryOpen(true);
  };

  const handleCanvasPreviewClick = (canvasId: string) => {
    setPendingCanvasId(canvasId);
    setIsGalleryOpen(true);
  };

  const handleCanvasSelectionChange = (canvas: CanvasGalleryItem) => {
    setPendingCanvasId(canvas.id);
  };

  const handleConfirmCanvas = () => {
    const canvas = canvasLookup.get(pendingCanvasId);
    if (!canvas) return;

    setSelectedCanvas(canvas.id);
    setFormData((prev) => ({
      ...prev,
      title: prev.title || canvas.name,
      canvasImageUrl: canvas.imageUrl,
      canvasName: canvas.name,
    }));
    setImagePreview(canvas.imageUrl);
    setPendingImageFile(null);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setIsGalleryOpen(false);
  };

  const handleRemoveCanvasSelection = () => {
    setSelectedCanvas("");
    setPendingCanvasId("");
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      canvasImageUrl: "",
      canvasName: "",
    }));
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
  setPendingCanvasId("");
  setFormData((prev) => ({
    ...prev,
    canvasImageUrl: "", // clear old uploaded URL; we'll set it after upload on submit
    canvasName: "",
  }));

  setPendingImageFile(file);

  // preview locally immediately (no upload yet)
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  const url = URL.createObjectURL(file);
  setPreviewObjectUrl(url);
  setImagePreview(url);

  toast({ title: "Image selected", description: "Will upload when you save/publish." });
};

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

      const startDateTimeIso = dateTimeInZoneToIso(formData.startDate, formData.startTime);
      const endDateTimeIso = dateTimeInZoneToIso(formData.startDate, formData.endTime);

      // capacity rule
      const capacityInt = parseInt(formData.capacity, 10);
      if (Number.isNaN(capacityInt) || capacityInt < minCapacity) {
        throw new Error(`Capacity cannot be less than tickets sold (${minCapacity}).`);
      }

      const payload: any = {
        ...formData,
        startDateTime: startDateTimeIso,
        endDateTime: endDateTimeIso,
        ticketPriceCents: FIXED_TICKET_PRICE_CENTS,
        capacity: capacityInt,
        salesCutoffHours: 168,
        address: formData.eventFormat === "VIRTUAL" ? "" : formData.address,
        city: formData.eventFormat === "VIRTUAL" ? "" : formData.city,
        state: formData.eventFormat === "VIRTUAL" ? "" : formData.state,
        zip: formData.eventFormat === "VIRTUAL" ? "" : formData.zip,
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
  payload.canvasName = "";

  // update UI state
  setPendingImageFile(null);
  setFormData((prev) => ({ ...prev, canvasImageUrl: uploadJson.url, canvasName: "" }));
  setImagePreview(uploadJson.url);

  setIsUploading(false);
}

      // only on create do we set status via action buttons
      if (mode === "create") {
        payload.status = action === "publish" ? "PUBLISHED" : "DRAFT";
      } else if (publishOnSubmit) {
        payload.status = "PUBLISHED";
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
        </div>

        <form className="space-y-6" onSubmit={(e) => handleSubmit(e, mode === "create" ? "draft" : undefined)}>
          {/* Canvas Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Canvas</CardTitle>
              <CardDescription>
                Browse the canvas gallery or upload your own image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCanvas && formData.canvasImageUrl ? (
                <div className="space-y-3">
                  <Label>Selected Canvas</Label>
                  <div className="max-w-[180px] rounded-2xl border p-3 sm:max-w-[220px]">
                    <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-muted/40 p-2 sm:p-3">
                      <img
                        src={formData.canvasImageUrl}
                        alt={formData.canvasName || "Selected canvas"}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium">{formData.canvasName || "Selected canvas"}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={handleRemoveCanvasSelection}>
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>Preview Canvases</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Preview a few options, then open the full gallery to confirm your choice.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => openCanvasGallery()}>
                        <Images className="mr-2 h-4 w-4" />
                        View More
                      </Button>
                    </div>

                    {previewCanvases.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
                        {previewCanvases.map((canvas) => {
                          const isSelected = selectedCanvas === canvas.id;

                          return (
                            <button
                              key={canvas.id}
                              type="button"
                              onClick={() => handleCanvasPreviewClick(canvas.id)}
                              className={`rounded-2xl border p-2 text-left transition sm:p-3 ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-muted/40 p-2">
                                <img src={canvas.imageUrl} alt={canvas.name} className="h-full w-full object-contain" />
                              </div>
                              <p className="mt-2 line-clamp-2 text-xs font-medium sm:mt-3 sm:text-sm">{canvas.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Coming Soon</p>
                    )}
                  </div>

                  <div>
                    <Label>Or Upload Custom Image</Label>
                    <div className="mt-2">
                      {imagePreview && !selectedCanvas ? (
                        <div className="relative flex w-32 aspect-square items-center justify-center rounded-lg border bg-muted/40 p-2 sm:w-40 sm:p-3">
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview("");
                              setFormData((prev) => ({ ...prev, canvasImageUrl: "", canvasName: "" }));
                            }}
                            className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex aspect-square w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary/50 sm:w-40">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground sm:h-8 sm:w-8" />
                          ) : (
                            <>
                              <Upload className="mb-2 h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                              <span className="text-center text-xs text-muted-foreground sm:text-sm">Upload image</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <CanvasGalleryDialog
            open={isGalleryOpen}
            onOpenChange={setIsGalleryOpen}
            sections={canvasSections}
            pendingCanvasId={pendingCanvasId}
            onSelect={handleCanvasSelectionChange}
            onConfirm={handleConfirmCanvas}
          />

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value: "PUBLIC" | "PRIVATE") =>
                      setFormData({ ...formData, visibility: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Private Event</SelectItem>
                      <SelectItem value="PUBLIC">Public Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Public events appear in discovery. Private events stay hidden and are accessed by event code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={formData.eventFormat}
                    onValueChange={(value: "IN_PERSON" | "VIRTUAL") =>
                      setFormData({
                        ...formData,
                        eventFormat: value,
                        locationName:
                          value === "VIRTUAL" && !formData.locationName
                            ? "Virtual Event"
                            : formData.locationName,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PERSON">In Person</SelectItem>
                      <SelectItem value="VIRTUAL">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              <div className="space-y-4">
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
                    <p className="mt-1 text-xs text-destructive">{errors.startDate}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  placeholder={formData.eventFormat === "VIRTUAL" ? "e.g., Virtual Event" : "e.g., The Art Loft Studio"}
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  required
                />
              </div>

              {formData.eventFormat === "IN_PERSON" ? (
                <>
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
                </>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Guests will see this event as virtual. Share your meeting link and access instructions after booking.
                </div>
              )}
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
                  <Label>Ticket Price</Label>
                  <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm font-medium">
                    $35 per ticket
                  </div>
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

              <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Bookings close automatically at 11:59 PM, 7 days before the event date.
              </div>
            </CardContent>
          </Card>

          {/* Refund Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                {FIXED_REFUND_POLICY}
              </div>
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
                    {publishOnSubmit ? "Relaunching..." : "Saving..."}
                  </>
                ) : (
                  submitButtonLabel || "Save Changes"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
