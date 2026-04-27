"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { PAINT_COLOR_CATEGORIES } from "@/lib/product-catalog";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Subcategory = {
  id: string;
  name: string;
  slug: string;
};

type BatchRow = {
  id: string;
  name: string;
  subcategoryId: string;
  imageUrls: string[];
  colorOptions: Array<{
    label: string;
    hex: string;
  }>;
};

function createEmptyRow(): BatchRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    subcategoryId: "",
    imageUrls: [],
    colorOptions: [],
  };
}

export function BatchPaintKitForm({ subcategories }: { subcategories: Subcategory[] }) {
  const router = useRouter();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [rows, setRows] = useState<BatchRow[]>([createEmptyRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
  const [activeColorCategoryBySlot, setActiveColorCategoryBySlot] = useState<Record<string, string>>({});

  function updateRow(rowId: string, updates: Partial<BatchRow>) {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
    );
  }

  function removeRow(rowId: string) {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== rowId),
    );
  }

  function selectPaintKitColor(rowId: string, index: number, color: { label: string; hex: string }) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;

        const nextColorOptions = [...row.colorOptions];
        nextColorOptions[index] = {
          label: color.label,
          hex: color.hex,
        };

        return {
          ...row,
          colorOptions: nextColorOptions,
        };
      }),
    );

    setActiveColorCategoryBySlot((current) => {
      const next = { ...current };
      delete next[`${rowId}-${index}`];
      return next;
    });
  }

  function removeColorOption(rowId: string, index: number) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              colorOptions: row.colorOptions.filter((_, colorIndex) => colorIndex !== index),
            }
          : row,
      ),
    );
  }

  async function uploadImages(rowId: string, files: File[]) {
    if (files.length === 0) return;

    setUploadingRowId(rowId);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Image upload failed.");
        }

        uploadedUrls.push(data.url);
      }

      setRows((current) =>
        current.map((row) =>
          row.id === rowId
            ? { ...row, imageUrls: [...row.imageUrls, ...uploadedUrls].slice(0, 8) }
            : row,
        ),
      );

      toast({
        title: "Images uploaded",
        description: `${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} added.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload images.",
        variant: "destructive",
      });
    } finally {
      setUploadingRowId(null);
      if (fileInputRefs.current[rowId]) {
        fileInputRefs.current[rowId]!.value = "";
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    for (const row of rows) {
      if (!row.name.trim()) {
        toast({ title: "Missing name", description: "Each row needs a product name.", variant: "destructive" });
        return;
      }

      if (!row.subcategoryId) {
        toast({ title: "Missing sub-category", description: `${row.name} needs a sub-category.`, variant: "destructive" });
        return;
      }

      if (row.imageUrls.length === 0) {
        toast({ title: "Missing image", description: `${row.name} needs at least one image.`, variant: "destructive" });
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/products/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: rows.map((row) => ({
            name: row.name,
            subcategoryId: row.subcategoryId,
            imageUrls: row.imageUrls,
            colorOptions: row.colorOptions,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Batch creation failed.");
      }

      toast({
        title: "Products created",
        description: `${data.products.length} paint kit product${data.products.length === 1 ? "" : "s"} created.`,
      });

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not create products.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <h1 className="font-display text-3xl font-bold">Batch Create Paint Kits</h1>
        <p className="mt-1 text-muted-foreground">
          Quickly create multiple paint kit products with default pricing, SKU rules, description, and active status.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {rows.map((row, rowIndex) => (
          <Card key={row.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Paint Kit #{rowIndex + 1}</CardTitle>
                  <CardDescription>
                    Default: Paint Kits category, USD, $35 medium, $45 large, active.
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1 || isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={row.name}
                    onChange={(event) => updateRow(row.id, { name: event.target.value })}
                    placeholder="Winds of Revival"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sub-category</Label>
                  <Select
                    value={row.subcategoryId || undefined}
                    onValueChange={(value) => updateRow(row.id, { subcategoryId: value })}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Images</Label>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRefs.current[row.id]?.click()}
                    disabled={isSaving || uploadingRowId === row.id}
                  >
                    {uploadingRowId === row.id ? (
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
                    ref={(element) => {
                      fileInputRefs.current[row.id] = element;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      void uploadImages(row.id, files);
                    }}
                  />

                  <p className="text-sm text-muted-foreground">
                    {row.imageUrls.length}/8 images uploaded.
                  </p>
                </div>

                {row.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {row.imageUrls.map((imageUrl) => (
                      <div key={imageUrl} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                        <img src={imageUrl} alt={row.name || "Product"} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(row.id, {
                              imageUrls: row.imageUrls.filter((url) => url !== imageUrl),
                            })
                          }
                          className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 rounded-lg border bg-muted/15 p-4">
                <div>
                  <Label className="text-base">Paint Colors</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose the paint colors included in this kit. These show on the shop card and product details.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    ...row.colorOptions,
                    ...(row.colorOptions.length < 12 ? [{ label: "", hex: "" }] : []),
                  ].map((colorOption, index) => {
                    const isSelected = Boolean(colorOption.label && colorOption.hex);
                    const slotKey = `${row.id}-${index}`;
                    const activeCategoryName =
                      activeColorCategoryBySlot[slotKey] ?? PAINT_COLOR_CATEGORIES[0]?.name ?? "";
                    const activeCategory =
                      PAINT_COLOR_CATEGORIES.find((category) => category.name === activeCategoryName) ??
                      PAINT_COLOR_CATEGORIES[0];
                    const selectedLabels = new Set(
                      row.colorOptions
                        .filter((_, colorIndex) => colorIndex !== index)
                        .map((selectedColor) => selectedColor.label.toLowerCase()),
                    );

                    return (
                      <div key={`${row.id}-paint-kit-color-${index}`} className="relative">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition",
                                isSelected
                                  ? "border-black/20 text-white shadow-sm ring-2 ring-transparent hover:ring-black/20"
                                  : "border-dashed border-black/25 bg-background text-black/55 hover:border-black/45 hover:text-black",
                              )}
                              style={isSelected ? { backgroundColor: colorOption.hex } : undefined}
                              disabled={isSaving}
                              aria-label={isSelected ? `Change ${colorOption.label}` : "Add paint color"}
                            >
                              {isSelected ? null : <Plus className="h-5 w-5" />}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-72 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              {PAINT_COLOR_CATEGORIES.map((category) => (
                                <button
                                  key={category.name}
                                  type="button"
                                  onClick={() =>
                                    setActiveColorCategoryBySlot((current) => ({
                                      ...current,
                                      [slotKey]: category.name,
                                    }))
                                  }
                                  className={cn(
                                    "rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                                    activeCategoryName === category.name
                                      ? "bg-black text-white"
                                      : "bg-muted/60 text-foreground hover:bg-muted",
                                  )}
                                >
                                  {category.name}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto border-t pt-3">
                              {activeCategory?.colors.map((color) => {
                                const isDisabled = selectedLabels.has(color.label.toLowerCase());

                                return (
                                  <DropdownMenuItem
                                    key={`${activeCategory.name}-${color.label}`}
                                    disabled={isDisabled}
                                    onSelect={() => selectPaintKitColor(row.id, index, color)}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2"
                                  >
                                    <span
                                      className="h-6 w-6 rounded-full border border-black/15"
                                      style={{ backgroundColor: color.hex }}
                                      aria-hidden="true"
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-medium">{color.label}</span>
                                      <span className="block text-xs text-muted-foreground">{color.hex}</span>
                                    </span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => removeColorOption(row.id, index)}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-sm"
                            disabled={isSaving}
                            aria-label={`Remove ${colorOption.label}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {row.colorOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {row.colorOptions.map((colorOption) => (
                      <span key={colorOption.label} className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1">
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: colorOption.hex }}
                          aria-hidden="true"
                        />
                        {colorOption.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((current) => [...current, createEmptyRow()])}
            disabled={isSaving}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>

          <Button type="submit" disabled={isSaving || uploadingRowId !== null}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Products...
              </>
            ) : (
              "Create All Products"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}