"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface Event {
  id: string;
  status: string;
  slug: string;
}

export function EventActions({ event }: { event: Event }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleStatusChange = async (status: "PUBLISHED" | "CANCELED") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event");
      }

      toast({
        title: status === "PUBLISHED" ? "Event published!" : "Event canceled",
        description:
          status === "PUBLISHED"
            ? "Your event is now live."
            : "The event has been canceled.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {event.status === "PUBLISHED" && (
            <DropdownMenuItem asChild>
              <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                View Public Page
              </a>
            </DropdownMenuItem>
          )}

          {event.status === "DRAFT" && (
            <DropdownMenuItem onClick={() => handleStatusChange("PUBLISHED")}>
              <Check className="w-4 h-4 mr-2" />
              Publish Event
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {event.status !== "CANCELED" && (
            <DropdownMenuItem
              onClick={() => setShowCancelDialog(true)}
              className="text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Event
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event? Guests will need to be
              refunded manually. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Event
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("CANCELED")}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}