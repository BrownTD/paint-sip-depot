"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CanvasGalleryItem, CanvasGallerySection } from "@/lib/canvas-gallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CanvasGalleryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: CanvasGallerySection[];
  pendingCanvasId: string;
  onSelect: (item: CanvasGalleryItem) => void;
  onConfirm: () => void;
};

function CanvasPaintColors({ colors }: { colors?: CanvasGalleryItem["colorOptions"] }) {
  if (!colors || colors.length === 0) {
    return null;
  }

  const visibleColors = colors.slice(0, 5);
  const remainingCount = colors.length - visibleColors.length;

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {visibleColors.map((color) => (
        <span
          key={color.id}
          className="h-4 w-4 rounded-full border border-black/10"
          style={{ backgroundColor: color.hex }}
          title={color.label}
        />
      ))}
      {remainingCount > 0 ? (
        <span className="text-[11px] font-semibold text-muted-foreground">+{remainingCount}</span>
      ) : null}
    </div>
  );
}

export function CanvasGalleryDialog({
  open,
  onOpenChange,
  sections,
  pendingCanvasId,
  onSelect,
  onConfirm,
}: CanvasGalleryDialogProps) {
  const pendingSectionId = useMemo(
    () => sections.find((section) => section.items.some((item) => item.id === pendingCanvasId))?.id ?? "",
    [pendingCanvasId, sections]
  );
  const allItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const [activeItemId, setActiveItemId] = useState("");
  const activeItem = useMemo(
    () => allItems.find((item) => item.id === activeItemId) ?? null,
    [activeItemId, allItems],
  );
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!open || !pendingSectionId) return;

    sectionRefs.current[pendingSectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [open, pendingSectionId]);

  useEffect(() => {
    if (!open) {
      setActiveItemId("");
    }
  }, [open]);

  function openItemDetail(item: CanvasGalleryItem) {
    onSelect(item);
    setActiveItemId(item.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Canvas Gallery</DialogTitle>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className={`absolute inset-0 space-y-8 overflow-y-auto px-6 py-6 transition duration-300 ease-out ${
              activeItem ? "pointer-events-none -translate-x-8 opacity-0" : "translate-x-0 opacity-100"
            }`}
            aria-hidden={Boolean(activeItem)}
          >
            {sections.map((section) => (
              <section
                key={section.id}
                ref={(node) => {
                  sectionRefs.current[section.id] = node;
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                </div>

                {section.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Coming Soon</p>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-max gap-5">
                      {section.items.map((item) => {
                        const isSelected = item.id === pendingCanvasId;

                        return (
                          <div key={item.id} className="w-[220px] shrink-0">
                            <button
                              type="button"
                              onClick={() => openItemDetail(item)}
                              className={`flex w-full flex-col rounded-2xl border bg-card p-3 text-left transition ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl p-3">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  width={280}
                                  height={350}
                                  className="h-full w-full object-contain"
                                  unoptimized
                                />
                              </div>
                              <span className="mt-3 line-clamp-2 text-sm font-medium">{item.name}</span>
                              <CanvasPaintColors colors={item.colorOptions} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          <div
            className={`absolute inset-0 overflow-y-auto px-6 py-6 transition duration-300 ease-out ${
              activeItem ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-full opacity-0"
            }`}
            aria-hidden={!activeItem}
          >
            {activeItem ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(activeItem.imageUrls?.length ? activeItem.imageUrls : [activeItem.imageUrl]).map((imageUrl, index) => (
                      <div
                        key={`${activeItem.id}-${imageUrl}-${index}`}
                        className="flex aspect-[4/5] items-center justify-center rounded-2xl border p-3"
                      >
                        <Image
                          src={imageUrl}
                          alt={`${activeItem.name} image ${index + 1}`}
                          width={320}
                          height={400}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col rounded-2xl border bg-card p-5">
                  <p className="text-sm font-medium text-muted-foreground">{activeItem.category}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{activeItem.name}</h3>
                  <CanvasPaintColors colors={activeItem.colorOptions} />
                  {activeItem.description ? (
                    <p className="mt-5 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {activeItem.description}
                    </p>
                  ) : null}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => setActiveItemId("")} type="button">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button onClick={onConfirm} type="button">
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
