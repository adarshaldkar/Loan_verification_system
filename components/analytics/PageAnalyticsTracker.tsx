"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

export default function PageAnalyticsTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    // Report previous page duration if switching pages
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      const durationMs = Date.now() - startTimeRef.current;
      sendTelemetry({
        page: prevPathRef.current,
        durationMs,
        error: false,
      });
    }

    // Update refs for new page
    prevPathRef.current = pathname;
    startTimeRef.current = Date.now();

    // Determine current user role from stored credentials
    let role = "anonymous";
    try {
      if (typeof window !== "undefined") {
        if (localStorage.getItem(STORAGE_KEYS.USER)) {
          role = "admin";
        } else if (localStorage.getItem(STORAGE_KEYS.AGENT)) {
          role = "agent";
        }
      }
    } catch {}

    // Track page view event immediately
    sendTelemetry({
      page: pathname,
      role,
      error: false,
    });

    // Global client-side unhandled error listener for this page
    const errorHandler = (event: ErrorEvent) => {
      sendTelemetry({
        page: pathname,
        role,
        error: true,
        errorType: event.error?.name || "RUNTIME_ERROR",
      });
    };

    window.addEventListener("error", errorHandler);
    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, [pathname]);

  return null;
}

function sendTelemetry(data: {
  page: string;
  role?: string;
  durationMs?: number;
  error: boolean;
  errorType?: string;
}) {
  try {
    const payload = JSON.stringify(data);
    const apiUrl = "/api/v1/analytics/page-view";

    // Use sendBeacon if available for non-blocking reliability even on page unload
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(apiUrl, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
