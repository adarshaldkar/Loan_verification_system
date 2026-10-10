"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";
import { initializeFaro, getWebInstrumentations, Faro } from "@grafana/faro-web-sdk";

// Initialize Grafana Faro Web SDK if configured (Browser-only, client-side)
let faroInstance: Faro | null = null;

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_FARO_URL &&
  !faroInstance
) {
  try {
    faroInstance = initializeFaro({
      url: process.env.NEXT_PUBLIC_FARO_URL,
      app: {
        name: process.env.NEXT_PUBLIC_FARO_APP_NAME || "lvms-frontend",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "production",
      },
      instrumentations: [
        ...getWebInstrumentations({
          captureConsole: false, // Strict PII protection: don't capture raw console
        }),
      ],
    });
  } catch (err) {
    // Graceful fallback if Faro fails to connect
    console.warn("Grafana Faro initialization skipped:", err);
  }
}

export default function PageAnalyticsTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    // Report previous page duration when switching pages
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

    // Track page view event immediately (both backend Prometheus ingestion & Faro)
    sendTelemetry({
      page: pathname,
      role,
      error: false,
    });

    if (faroInstance?.api) {
      try {
        faroInstance.api.setView({ name: pathname });
      } catch {}
    }

    // ─── Core Web Vitals Monitoring via PerformanceObserver ──────────────────
    let clsScore = 0;
    let observer: PerformanceObserver | null = null;

    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      try {
        observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.entryType === "largest-contentful-paint") {
              const lcpSeconds = entry.startTime / 1000;
              sendTelemetry({
                page: pathname,
                role,
                error: false,
                webVitals: { lcp: lcpSeconds },
              });
            } else if (entry.entryType === "layout-shift") {
              const shift = (entry as any).value || 0;
              clsScore += shift;
              sendTelemetry({
                page: pathname,
                role,
                error: false,
                webVitals: { cls: clsScore },
              });
            }
          }
        });

        observer.observe({
          type: "largest-contentful-paint",
          buffered: true,
        });
      } catch {}
    }

    // Global client-side unhandled error listener for this page
    const errorHandler = (event: ErrorEvent) => {
      sendTelemetry({
        page: pathname,
        role,
        error: true,
        errorType: event.error?.name || "RUNTIME_ERROR",
      });

      if (faroInstance?.api && event.error) {
        try {
          faroInstance.api.pushError(event.error);
        } catch {}
      }
    };

    window.addEventListener("error", errorHandler);
    return () => {
      window.removeEventListener("error", errorHandler);
      if (observer) {
        observer.disconnect();
      }
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
  webVitals?: Record<string, number>;
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
