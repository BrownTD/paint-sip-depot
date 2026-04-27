"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AdminProductListItem = {
  id: string;
  name: string;
  sku: string;
  thumbnailUrl: string | null;
  categoryName: string;
  subcategoryName: string | null;
  priceDisplay: string;
  currency: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAtLabel: string;
  orderCount: number;
};

const statusVariants = {
  ACTIVE: "success",
  ARCHIVED: "outline",
} as const;

type ProductStatusFilter = "ACTIVE" | "ARCHIVED" | "ALL";

const statusFilterOptions: { label: string; value: ProductStatusFilter }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
  { label: "All", value: "ALL" },
];

export function AdminProductsPageContent({
  products,
}: {
  products: AdminProductListItem[];
}) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<AdminProductListItem | null>(null);
  const [actionProductId, setActionProductId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("ACTIVE");

  const summary = useMemo(
    () => ({
      total: products.length,
      active: products.filter((product) => product.status === "ACTIVE").length,
      archived: products.filter((product) => product.status === "ARCHIVED").length,
    }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    if (statusFilter === "ALL") return products;
    return products.filter((product) => product.status === statusFilter);
  }, [products, statusFilter]);

  async function updateStatus(productId: string, status: "ACTIVE" | "ARCHIVED") {
    setActionProductId(productId);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product status.");
      }

      toast({
        title: status === "ARCHIVED" ? "Product archived" : "Product restored",
        description:
          status === "ARCHIVED"
            ? "The product is now hidden from the public shop."
            : "The product is live in the public shop again.",
      });

      setSelectedProduct(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Failed to update product.",
        variant: "destructive",
      });
    } finally {
      setActionProductId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage the shop catalog, Stripe product sync, and archived product recovery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
  <Button asChild variant="outline">
    <Link href="/admin/products/batch-create">
      Batch Create
    </Link>
  </Button>

  <Button asChild>
    <Link href="/admin/products/new">
      <PackagePlus className="mr-2 h-4 w-4" />
      New Product
    </Link>
  </Button>
</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Archived Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.archived}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Catalog</CardTitle>
          <div className="flex rounded-lg border bg-muted/20 p-1">
            {statusFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === option.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {products.length === 0
                  ? "No products yet. Create your first shop product to start selling through the site."
                  : `No ${statusFilter === "ALL" ? "" : statusFilter.toLowerCase()} products found.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px]">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Currency
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const isBusy = actionProductId === product.id;

                    return (
                      <tr
                        key={product.id}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                              {product.thumbnailUrl ? (
                                <img
                                  src={product.thumbnailUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.subcategoryName || "No sub-category"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          <div>
                            <p className="font-medium">{product.categoryName}</p>
                            <p className="text-muted-foreground">
                              {product.subcategoryName || "Standard catalog item"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm font-medium">
                          {product.sku}
                        </td>
                        <td className="px-4 py-3 align-top text-sm font-medium">
                          {product.priceDisplay}
                        </td>
                        <td className="px-4 py-3 align-top text-sm uppercase text-muted-foreground">
                          {product.currency}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant={statusVariants[product.status]}>
                            {product.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top text-sm font-medium">
                          {product.orderCount}
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                          {product.createdAtLabel}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                            </Button>
                            {product.status === "ACTIVE" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => setSelectedProduct(product)}
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="ml-2">Archive</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => void updateStatus(product.id, "ACTIVE")}
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                                <span className="ml-2">Restore</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Product?</DialogTitle>
            <DialogDescription>
              Archived products stay in the database for order history, but they disappear from the
              public shop and stop being available for new checkouts.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct ? (
            <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              <p className="font-medium">{selectedProduct.name}</p>
              <p className="mt-1 text-muted-foreground">
                {selectedProduct.categoryName}
                {selectedProduct.subcategoryName ? ` · ${selectedProduct.subcategoryName}` : ""}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedProduct(null)}
              disabled={Boolean(actionProductId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!selectedProduct || Boolean(actionProductId)}
              onClick={() => {
                if (selectedProduct) {
                  void updateStatus(selectedProduct.id, "ARCHIVED");
                }
              }}
            >
              {actionProductId && selectedProduct?.id === actionProductId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                "Archive Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
