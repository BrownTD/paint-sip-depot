"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GOOGLE_ANALYTICS_ID } from "@/lib/google-analytics";

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>,
    ) => void;
  }
}

export function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const queryString = searchParams.toString();
    const pagePath = queryString ? `${pathname}?${queryString}` : pathname;

    window.gtag?.("config", GOOGLE_ANALYTICS_ID, {
      page_path: pagePath,
    });
  }, [pathname, searchParams]);

  return null;
}
