"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FindEventCodeForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);

  return (
    <form
      id="event-code"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const next = code.trim();
        router.push(next ? `/events?code=${encodeURIComponent(next)}#event-code` : "/events#event-code");
      }}
    >
      <label htmlFor="event-code-input" className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Enter Event Code
      </label>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="event-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Example: PSD-84K2M"
            className="h-14 rounded-full border-border/70 pl-12 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-14 rounded-full px-8">
          Find Event
        </Button>
      </div>
    </form>
  );
}
