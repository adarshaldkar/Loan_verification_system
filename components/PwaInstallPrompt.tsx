"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

// Capture beforeinstallprompt immediately on script load
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    (window as any).__lvms_deferred_prompt = e;
  });
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker notice:", err.message);
        });
    }

    // 3. Detect iOS Safari
    const userAgent = (window.navigator.userAgent || "").toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // 4. If prompt was captured before mount, activate it
    if ((window as any).__lvms_deferred_prompt) {
      setDeferredPrompt((window as any).__lvms_deferred_prompt);
      const isDismissed = sessionStorage.getItem("lvms_pwa_dismissed");
      if (!isDismissed) {
        setTimeout(() => setShowPrompt(true), 1000);
      }
    }

    // 5. Capture native Chrome/Edge install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__lvms_deferred_prompt = e;
      const isDismissed = sessionStorage.getItem("lvms_pwa_dismissed");
      if (!isDismissed) {
        setTimeout(() => setShowPrompt(true), 1000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. On iOS Safari, beforeinstallprompt never fires; show banner directly after short delay
    if (isIosDevice) {
      const isDismissed = sessionStorage.getItem("lvms_pwa_dismissed");
      if (!isDismissed) {
        setTimeout(() => setShowPrompt(true), 1500);
      }
    }

    // 6. Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      (window as any).__lvms_deferred_prompt = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 7. Global manual trigger from topbar/sidebar/login
    const handleManualTrigger = async () => {
      const prompt = (window as any).__lvms_deferred_prompt || deferredPrompt;
      if (prompt) {
        try {
          prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === "accepted") {
            setShowPrompt(false);
            setIsInstalled(true);
          }
          (window as any).__lvms_deferred_prompt = null;
          setDeferredPrompt(null);
        } catch (err) {
          console.warn("Install prompt error:", err);
        }
      } else if (isIosDevice) {
        toast.info("On iPhone: Tap Safari's Share button ⎋ then 'Add to Home Screen'");
      } else {
        toast.info("Tap browser menu (⋮) → 'Install App' or 'Add to Home screen'");
      }
    };

    window.addEventListener("lvms:open-install-prompt", handleManualTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("lvms:open-install-prompt", handleManualTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || (window as any).__lvms_deferred_prompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          setShowPrompt(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        (window as any).__lvms_deferred_prompt = null;
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    } else if (isIOS) {
      toast.info("On iPhone: Tap Safari's Share button ⎋ then 'Add to Home Screen'");
    } else {
      toast.info("Tap browser menu (⋮) → 'Install App' or 'Add to Home screen'");
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("lvms_pwa_dismissed", "true");
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo-icon.png"
            alt="Sky Line Risk"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain p-1 rounded-xl bg-slate-800/90 border border-slate-700/80 shrink-0 shadow-lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                Sky Line Risk App
              </h4>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300/90 mt-0.5 line-clamp-2">
              {isIOS
                ? "Tap Share ⎋ then 'Add to Home Screen' for full-screen mode"
                : "Install on your home screen for quick field access & offline mode"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs px-3 sm:px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
