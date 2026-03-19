"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { dateTimeInZoneToIso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type EventCutoffOverrideControlProps = {
  eventId: string;
  initialDate: string;
  initialTime: string;
  hasOverride: boolean;
};

export function EventCutoffOverrideControl({
  eventId,
  initialDate,
  initialTime,
  hasOverride,
}: EventCutoffOverrideControlProps) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [overrideActive, setOverrideActive] = useState(hasOverride);
  const [isSaving, setIsSaving] = useState(false);

  const saveOverride = async () => {
    if (!date || !time) {
      toast({
        title: "Missing cutoff",
        description: "Pick both a date and time for the admin cutoff override.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const bookingCutoffOverrideAt = dateTimeInZoneToIso(date, time);
      const res = await fetch(`/api/admin/events/${eventId}/cutoff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCutoffOverrideAt }),
      });

      if (!res.ok) {
        throw new Error("Failed to save admin cutoff override");
      }

      setOverrideActive(true);
      toast({ title: "Admin cutoff saved" });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save cutoff override.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearOverride = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/cutoff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCutoffOverrideAt: null }),
      });

      if (!res.ok) {
        throw new Error("Failed to clear admin cutoff override");
      }

      setOverrideActive(false);
      toast({ title: "Admin cutoff cleared" });
    } catch (error) {
      toast({
        title: "Clear failed",
        description: error instanceof Error ? error.message : "Could not clear cutoff override.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={saveOverride} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Override
        </Button>
        <Button size="sm" variant="outline" onClick={clearOverride} disabled={isSaving || !overrideActive}>
          Clear
        </Button>
      </div>
    </div>
  );
}
