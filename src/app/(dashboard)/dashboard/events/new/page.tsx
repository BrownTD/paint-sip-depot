"use client";

import { useState, useEffect } from "react";
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
];

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    locationName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    ticketPrice: "",
    capacity: "",
    salesCutoffHours: "48",
    refundPolicyText:
      "Full refunds available up to 72 hours before the event. 50% refund between 72-48 hours. No refunds within 48 hours of the event.",
    canvasImageUrl: "",
  });

  useEffect(() => {
    fetch("/api/canvases")
      .then((res) => res.json())
      .then((data) => setCanvases(data.canvases || []))
      .catch(console.error);
  }, []);

  const handleCanvasSelect = (canvasId: string) => {
    setSelectedCanvas(canvasId);
    const canvas = canvases.find((c) => c.id === canvasId);
    if (canvas) {
      setFormData((prev) => ({
        ...prev,
        title: prev.title || canvas.name,
        canvasImageUrl: canvas.imageUrl,
      }));
      setImagePreview(canvas.imageUrl);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, canvasImageUrl: data.url }));
      setImagePreview(data.url);
      setSelectedCanvas("");
      toast({ title: "Image uploaded successfully" });
    } catch {
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, action: "draft" | "publish") => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime =
        formData.endDate && formData.endTime
          ? new Date(`${formData.endDate}T${formData.endTime}`)
          : null;

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime?.toISOString(),
          ticketPriceCents: Math.round(parseFloat(formData.ticketPrice) * 100),
          capacity: parseInt(formData.capacity),
          salesCutoffHours: parseInt(formData.salesCutoffHours),
          status: action === "publish" ? "PUBLISHED" : "DRAFT",
          canvasId: selectedCanvas || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      const data = await res.json();
      toast({
        title: action === "publish" ? "Event published!" : "Draft saved!",
        description:
          action === "publish"
            ? "Your event is now live and accepting bookings."
            : "You can publish it when ready.",
      });
      router.push(`/dashboard/events/${data.event.id}`);
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
      <div className="mb-6">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground mt-1">
            Set up your paint and sip event details
          </p>
        </div>

        <form className="space-y-6">
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
                        <Image
                          src={canvas.imageUrl}
                          alt={canvas.name}
                          fill
                          className="object-cover"
                        />
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
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setFormData((prev) => ({ ...prev, canvasImageUrl: "" }));
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
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (optional)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
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
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="45.00"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    placeholder="24"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
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
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, "publish")}
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
          </div>
        </form>
      </div>
    </div>
  );
}