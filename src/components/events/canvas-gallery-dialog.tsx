"use client";

import { useEffect, useMemo, useRef } from "react";

import type { CanvasGalleryItem, CanvasGallerySection } from "@/lib/canvas-gallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!open || !pendingSectionId) return;

    sectionRefs.current[pendingSectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [open, pendingSectionId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Canvas Gallery</DialogTitle>
          <DialogDescription>
            Browse by collection and confirm a canvas when you are ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
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
                            onClick={() => onSelect(item)}
                            className={`flex w-full flex-col rounded-2xl border bg-card p-3 text-left transition ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-muted/40 p-3">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <span className="mt-3 line-clamp-2 text-sm font-medium">{item.name}</span>
                          </button>

                          {isSelected ? (
                            <Button className="mt-3 w-full" onClick={onConfirm} type="button">
                              Confirm
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
