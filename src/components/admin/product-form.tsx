"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Plus,
  ScanBarcode,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CANVASES_CATEGORY_ID,
  CANVAS_DEFAULT_DESCRIPTION,
  CANVAS_DEFAULT_LARGE_PRICE,
  CANVAS_DEFAULT_MEDIUM_PRICE,
  COUPLES_SUBCATEGORY_SLUG,
  PAINT_CATEGORY_ID,
  getCategoryBadgeLabel,
  getCategoryDisplayName,
  PRODUCT_VARIANT_SIZE,
} from "@/lib/product-catalog";
import { cn } from "@/lib/utils";
import { formatCurrencyAmount } from "@/lib/money";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MAX_PRODUCT_IMAGES = 8;
const DEFAULT_CURRENCY = "USD";

export type AdminProductFormCategory = {
  id: string;
  name: string;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export type AdminProductFormInitialProduct = {
  id: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  imageUrls: string[];
  status: "ACTIVE" | "ARCHIVED";
  priceCents: number;
  discountPercent: number | null;
  currency: string;
  colorOptions: Array<{
    id?: string;
    label: string;
    hex: string;
  }>;
  variants: Array<{
    size: "MEDIUM" | "LARGE";
    priceCents: number;
    currency: string;
  }>;
};

function formatPriceInput(amountCents: number | undefined) {
  if (!amountCents) return "";
  return (amountCents / 100).toFixed(2);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function ProductForm({
  mode,
  categories,
  initialProduct,
}: {
  mode: "create" | "edit";
  categories: AdminProductFormCategory[];
  initialProduct?: AdminProductFormInitialProduct;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediumVariant = initialProduct?.variants.find(
    (variant) => variant.size === PRODUCT_VARIANT_SIZE.medium,
  );
  const largeVariant = initialProduct?.variants.find(
    (variant) => variant.size === PRODUCT_VARIANT_SIZE.large,
  );

  const [form, setForm] = useState({
    name: initialProduct?.name ?? "",
    description: initialProduct?.description ?? "",
    categoryId: initialProduct?.categoryId ?? "",
    subcategoryId: initialProduct?.subcategoryId ?? "",
    imageUrls: initialProduct?.imageUrls ?? [],
    currency:
      mediumVariant?.currency?.toUpperCase() ??
      largeVariant?.currency?.toUpperCase() ??
      initialProduct?.currency?.toUpperCase() ??
      DEFAULT_CURRENCY,
    basePrice: formatPriceInput(initialProduct?.priceCents),
    discountPercent: initialProduct?.discountPercent ? String(initialProduct.discountPercent) : "",
    mediumPrice: formatPriceInput(mediumVariant?.priceCents),
    largePrice: formatPriceInput(largeVariant?.priceCents),
    status: initialProduct?.status ?? "ACTIVE",
    colorOptions:
      initialProduct?.colorOptions.map((colorOption) => ({
        id: colorOption.id,
        label: colorOption.label,
        hex: colorOption.hex,
      })) ?? [],
  });
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId) ?? null,
    [categories, form.categoryId],
  );
  const availableSubcategories = selectedCategory?.subcategories ?? [];
  const selectedSubcategory = useMemo(
    () =>
      availableSubcategories.find((subcategory) => subcategory.id === form.subcategoryId) ?? null,
    [availableSubcategories, form.subcategoryId],
  );
  const isCanvasProduct = form.categoryId === CANVASES_CATEGORY_ID;
  const isPaintProduct = form.categoryId === PAINT_CATEGORY_ID;
  const isCouplesLayout =
    selectedSubcategory?.slug === COUPLES_SUBCATEGORY_SLUG && form.imageUrls.length >= 2;
  const hasDiscount = form.discountPercent.trim().length > 0;
  const hasColorOptions = form.colorOptions.length > 0;

  const previewPrices = {
    base: Number.parseFloat(form.basePrice || "0"),
    medium: Number.parseFloat(form.mediumPrice || "0"),
    large: Number.parseFloat(form.largePrice || "0"),
  };

  const previewBadges = [
    selectedCategory ? getCategoryBadgeLabel(selectedCategory.id, selectedCategory.name) : null,
    selectedSubcategory?.name,
    form.status === "ARCHIVED" ? "Archived" : "Active",
  ].filter(Boolean) as string[];

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addColorOption() {
    setForm((current) => ({
      ...current,
      colorOptions: [
        ...current.colorOptions,
        {
          id: undefined,
          label: "",
          hex: "#000000",
        },
      ],
    }));
  }

  function updateColorOption(index: number, field: "label" | "hex", value: string) {
    setForm((current) => ({
      ...current,
      colorOptions: current.colorOptions.map((colorOption, colorIndex) =>
        colorIndex === index
          ? {
              ...colorOption,
              [field]: value,
            }
          : colorOption,
      ),
    }));
  }

  function removeColorOption(index: number) {
    setForm((current) => ({
      ...current,
      colorOptions: current.colorOptions.filter((_, colorIndex) => colorIndex !== index),
    }));
  }

  function handleCategoryChange(categoryId: string) {
    const nextCategory = categories.find((category) => category.id === categoryId) ?? null;
    const nextSubcategoryIds = new Set(nextCategory?.subcategories.map((item) => item.id) ?? []);

    setForm((current) => {
      const nextIsCanvas = categoryId === CANVASES_CATEGORY_ID;

      return {
        ...current,
        categoryId,
        subcategoryId: nextSubcategoryIds.has(current.subcategoryId) ? current.subcategoryId : "",
        description:
          mode === "create" && nextIsCanvas && !current.description.trim()
            ? CANVAS_DEFAULT_DESCRIPTION
            : current.description,
        basePrice: nextIsCanvas ? current.basePrice : current.basePrice,
        mediumPrice:
          mode === "create" && nextIsCanvas && !current.mediumPrice.trim()
            ? String(CANVAS_DEFAULT_MEDIUM_PRICE)
            : current.mediumPrice,
        largePrice:
          mode === "create" && nextIsCanvas && !current.largePrice.trim()
            ? String(CANVAS_DEFAULT_LARGE_PRICE)
            : current.largePrice,
        colorOptions:
          categoryId === PAINT_CATEGORY_ID || current.colorOptions.length === 0
            ? current.colorOptions
            : [],
      };
    });
  }

  useEffect(() => {
    if (mode !== "create" || !isCanvasProduct) {
      return;
    }

    setForm((current) => ({
      ...current,
      description: current.description.trim() ? current.description : CANVAS_DEFAULT_DESCRIPTION,
      mediumPrice: current.mediumPrice.trim() ? current.mediumPrice : String(CANVAS_DEFAULT_MEDIUM_PRICE),
      largePrice: current.largePrice.trim() ? current.largePrice : String(CANVAS_DEFAULT_LARGE_PRICE),
    }));
  }, [isCanvasProduct, mode]);

  function addImageUrl(url: string) {
    if (form.imageUrls.includes(url)) {
      return;
    }

    if (form.imageUrls.length >= MAX_PRODUCT_IMAGES) {
      toast({
        title: "Image limit reached",
        description: `You can add up to ${MAX_PRODUCT_IMAGES} product images.`,
        variant: "destructive",
      });
      return;
    }

    setForm((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, url],
    }));
  }

  function removeImageUrl(url: string) {
    setForm((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((item) => item !== url),
    }));
  }

  function handleAddManualImageUrl() {
    const nextUrl = manualImageUrl.trim();
    if (!nextUrl) {
      return;
    }

    try {
      new URL(nextUrl);
    } catch {
      toast({
        title: "Invalid image URL",
        description: "Enter a valid image URL before adding it.",
        variant: "destructive",
      });
      return;
    }

    addImageUrl(nextUrl);
    setManualImageUrl("");
  }

  async function handleUploadFiles(files: File[]) {
    const remainingSlots = MAX_PRODUCT_IMAGES - form.imageUrls.length;
    const selectedFiles = files.slice(0, remainingSlots);

    if (selectedFiles.length === 0) {
      toast({
        title: "Image limit reached",
        description: `You can add up to ${MAX_PRODUCT_IMAGES} product images.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImages(true);

    try {
      for (const file of selectedFiles) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload image.");
        }

        addImageUrl(data.url);
      }

      toast({
        title: "Images uploaded",
        description:
          selectedFiles.length === 1
            ? "Product image added."
            : `${selectedFiles.length} product images added.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast({
        title: "Name required",
        description: "Add a product name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!form.categoryId) {
      toast({
        title: "Category required",
        description: "Select a category before saving.",
        variant: "destructive",
      });
      return;
    }

    if (availableSubcategories.length > 0 && !form.subcategoryId) {
      toast({
        title: "Sub-category required",
        description: "Paint kit products must include a sub-category.",
        variant: "destructive",
      });
      return;
    }

    if (form.imageUrls.length === 0) {
      toast({
        title: "Image required",
        description: "Add at least one product image before saving.",
        variant: "destructive",
      });
      return;
    }

    const basePrice = Number.parseFloat(form.basePrice);
    const mediumPrice = Number.parseFloat(form.mediumPrice);
    const largePrice = Number.parseFloat(form.largePrice);
    const discountPercent = form.discountPercent.trim()
      ? Number.parseInt(form.discountPercent, 10)
      : null;

    if (hasDiscount && (!Number.isFinite(discountPercent) || !discountPercent || discountPercent < 1 || discountPercent > 95)) {
      toast({
        title: "Invalid discount",
        description: "Discount must be between 1% and 95%.",
        variant: "destructive",
      });
      return;
    }

    if (isPaintProduct && form.colorOptions.some((colorOption) => !colorOption.label.trim())) {
      toast({
        title: "Color name required",
        description: "Each color option needs a name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (isCanvasProduct) {
      if (!Number.isFinite(mediumPrice) || mediumPrice <= 0) {
        toast({
          title: "Invalid medium price",
          description: "Medium size must be greater than $0.00.",
          variant: "destructive",
        });
        return;
      }

      if (!Number.isFinite(largePrice) || largePrice <= 0) {
        toast({
          title: "Invalid large price",
          description: "Large size must be greater than $0.00.",
          variant: "destructive",
        });
        return;
      }
    } else if (!Number.isFinite(basePrice) || basePrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Price must be greater than $0.00.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initialProduct?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            currency: form.currency,
            categoryId: form.categoryId,
              subcategoryId: form.subcategoryId || null,
              imageUrls: form.imageUrls,
              status: form.status,
              discountPercent,
              colorOptions: isPaintProduct
                ? form.colorOptions.map((colorOption) => ({
                    label: colorOption.label,
                    hex: colorOption.hex,
                  }))
                : [],
              basePrice: isCanvasProduct ? mediumPrice : basePrice,
              variants: isCanvasProduct
                ? [
                  {
                    size: "MEDIUM",
                    price: mediumPrice,
                    currency: form.currency,
                  },
                  {
                    size: "LARGE",
                    price: largePrice,
                    currency: form.currency,
                  },
                ]
              : [],
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      toast({
        title: mode === "create" ? "Product created" : "Product updated",
        description:
          mode === "create"
            ? "Stripe product and prices were created successfully."
            : "Product changes were saved successfully.",
      });

      if (mode === "create") {
        router.push("/admin/products");
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save product.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">
            {mode === "create" ? "Create Product" : "Edit Product"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your shop catalog here. The app stays the source of truth, and Stripe only
            stores the payment-side product and price records.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                These details sync to your local catalog and the Stripe product record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Premium Floral Canvas Set"
                  maxLength={120}
                  disabled={isSaving}
                />
              </div>

              {initialProduct?.sku ? (
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <div className="flex h-11 items-center gap-2 rounded-md border bg-muted/20 px-3 text-sm font-medium">
                    <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                    <span>{initialProduct.sku}</span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Describe the product, what is included, and who it is for."
                  maxLength={3000}
                  rows={6}
                  disabled={isSaving}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId || undefined}
                    onValueChange={handleCategoryChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryDisplayName(category.id, category.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sub-category</Label>
                  <Select
                    value={form.subcategoryId || undefined}
                    onValueChange={(value) => updateField("subcategoryId", value)}
                    disabled={isSaving || availableSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          availableSubcategories.length > 0
                            ? "Select a sub-category"
                            : "Not used for this category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={form.currency}
                    onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
                    placeholder="USD"
                    maxLength={3}
                    disabled={isSaving}
                  />
                </div>

                {isCanvasProduct ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mediumPrice">Medium Price</Label>
                      <Input
                        id="mediumPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.mediumPrice}
                        onChange={(event) => updateField("mediumPrice", event.target.value)}
                        placeholder="35.00"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="largePrice">Large Price</Label>
                      <Input
                        id="largePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.largePrice}
                        onChange={(event) => updateField("largePrice", event.target.value)}
                        placeholder="45.00"
                        disabled={isSaving}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="basePrice">Price</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.basePrice}
                      onChange={(event) => updateField("basePrice", event.target.value)}
                      placeholder="18.00"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              {isCanvasProduct ? (
                <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  Paint kit products auto-fill the standard Paint &amp; Sip kit description and use
                  medium and large pricing by default.
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  Non-paint-kit products use a single price for now. Variant-specific pricing can be
                  added later without changing the SKU history for this product.
                </div>
              )}

              <div className="space-y-3 rounded-lg border bg-muted/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label className="text-base">Discount</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Optional merchandising discount. This saves to the app and Stripe metadata,
                      and only shows in the shop when set.
                    </p>
                  </div>
                  {hasDiscount ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField("discountPercent", "")}
                      disabled={isSaving}
                    >
                      Remove Discount
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField("discountPercent", "20")}
                      disabled={isSaving}
                    >
                      Add Discount
                    </Button>
                  )}
                </div>

                {hasDiscount ? (
                  <div className="max-w-[220px] space-y-2">
                    <Label htmlFor="discountPercent">Discount Percent</Label>
                    <div className="relative">
                      <Input
                        id="discountPercent"
                        type="number"
                        min="1"
                        max="95"
                        step="1"
                        value={form.discountPercent}
                        onChange={(event) => updateField("discountPercent", event.target.value)}
                        placeholder="20"
                        disabled={isSaving}
                        className="pr-10"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {isPaintProduct || hasColorOptions ? (
                <div className="space-y-4 rounded-lg border bg-muted/15 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Label className="text-base">Color Options</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Optional color picker for products like paint. Colors do not change price.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColorOption}
                      disabled={isSaving}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Color
                    </Button>
                  </div>

                  {hasColorOptions ? (
                    <div className="space-y-3">
                      {form.colorOptions.map((colorOption, index) => (
                        <div
                          key={colorOption.id ?? `color-option-${index}`}
                          className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]"
                        >
                          <div className="space-y-2">
                            <Label htmlFor={`color-label-${index}`}>Color Name</Label>
                            <Input
                              id={`color-label-${index}`}
                              value={colorOption.label}
                              onChange={(event) =>
                                updateColorOption(index, "label", event.target.value)
                              }
                              placeholder="Midnight Blue"
                              disabled={isSaving}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`color-hex-${index}`}>Hex</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`color-hex-${index}`}
                                type="color"
                                value={
                                  /^#[0-9A-F]{6}$/i.test(colorOption.hex)
                                    ? colorOption.hex
                                    : "#000000"
                                }
                                onChange={(event) =>
                                  updateColorOption(index, "hex", event.target.value.toUpperCase())
                                }
                                disabled={isSaving}
                                className="h-11 w-14 p-1"
                              />
                              <Input
                                value={colorOption.hex}
                                onChange={(event) =>
                                  updateColorOption(index, "hex", event.target.value.toUpperCase())
                                }
                                placeholder="#000000"
                                disabled={isSaving}
                              />
                            </div>
                          </div>
                          <div className="flex items-end sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeColorOption(index)}
                              disabled={isSaving}
                              aria-label={`Remove color option ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-background/80 px-4 py-5 text-sm text-muted-foreground">
                      No color options yet. Add them when this product should show a color picker in
                      the shop.
                    </div>
                  )}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: "ACTIVE" | "ARCHIVED") => updateField("status", value)}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload product images to storage or add public image URLs. Paint kit products in
                Couples &amp; Date Night should include two images for side-by-side display.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving || isUploadingImages}
                >
                  {isUploadingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length > 0) {
                      void handleUploadFiles(files);
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Up to {MAX_PRODUCT_IMAGES} images. JPG, PNG, WEBP, and GIF supported.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={manualImageUrl}
                  onChange={(event) => setManualImageUrl(event.target.value)}
                  placeholder="https://example.com/product-image.jpg"
                  disabled={isSaving || isUploadingImages}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddManualImageUrl}
                  disabled={isSaving || isUploadingImages}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add URL
                </Button>
              </div>

              {form.imageUrls.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <ImagePlus className="h-8 w-8" />
                    <p>No product images yet.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {form.imageUrls.map((imageUrl, index) => (
                    <div
                      key={imageUrl}
                      className="overflow-hidden rounded-lg border bg-background shadow-sm"
                    >
                      <div className="relative aspect-square bg-muted">
                        <img
                          src={imageUrl}
                          alt={`Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(imageUrl)}
                          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-black"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stripe Sync Rules</CardTitle>
              <CardDescription>
                Names, descriptions, images, and active status update the Stripe Product. Price
                changes create new Stripe Price records so old orders keep their original prices.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSaving || isUploadingImages}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating Product..." : "Saving Changes..."}
                </>
              ) : (
                <>{mode === "create" ? "Create Product" : "Save Changes"}</>
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/products">Cancel</Link>
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                This is how the product card will read in the shop before checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-[1.5rem] bg-[#f3f1ef] p-4">
                {form.imageUrls.length === 0 ? (
                  <div className="flex aspect-[4/4.4] items-center justify-center rounded-[1.2rem] border border-dashed border-black/10 bg-white text-sm text-black/45">
                    Preview image
                  </div>
                ) : isCouplesLayout ? (
                  <div className="grid aspect-[4/4.4] grid-cols-2 gap-2 overflow-hidden rounded-[1.2rem]">
                    {form.imageUrls.slice(0, 2).map((imageUrl) => (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[4/4.4] overflow-hidden rounded-[1.2rem]">
                    <img
                      src={form.imageUrls[0]}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {previewBadges.map((badge) => (
                    <Badge key={badge} variant={badge === "Archived" ? "outline" : "secondary"}>
                      {badge}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {form.name.trim() || "Product name"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {form.description.trim()
                      ? truncateText(form.description.trim(), 180)
                      : "Your product description preview will appear here."}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  {isCanvasProduct ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Medium</span>
                        <span className={cn(!previewPrices.medium && "text-muted-foreground")}>
                          {previewPrices.medium > 0
                            ? formatCurrencyAmount(
                                Math.round(previewPrices.medium * 100),
                                form.currency || DEFAULT_CURRENCY,
                              )
                            : "Set a price"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Large</span>
                        <span className={cn(!previewPrices.large && "text-muted-foreground")}>
                          {previewPrices.large > 0
                            ? formatCurrencyAmount(
                                Math.round(previewPrices.large * 100),
                                form.currency || DEFAULT_CURRENCY,
                              )
                            : "Set a price"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className={cn(!previewPrices.base && "text-muted-foreground")}>
                        {previewPrices.base > 0
                          ? formatCurrencyAmount(
                              Math.round(previewPrices.base * 100),
                              form.currency || DEFAULT_CURRENCY,
                            )
                          : "Set a price"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
