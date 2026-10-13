"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  X,
  Smartphone,
  CheckCircle,
  Share,
  MoreVertical,
  PlusSquare,
  Sparkles,
  Info,
  ExternalLink,
} from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

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

    // 2. Check secure context (HTTPS or localhost)
    const secure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    setIsSecure(secure);

    // 3. Register Service Worker if supported
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("LVMS Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker notice:", err.message);
        });
    }

    // 4. Device & Browser Detection
    const userAgent = (window.navigator.userAgent || "").toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice =
      isIosDevice ||
      isAndroidDevice ||
      /mobile|phone|tablet/.test(userAgent) ||
      window.innerWidth < 768;

    const inApp =
      /fban|fbav|instagram|line|micromessenger|snapchat|musical_ly|tiktok|whatsapp/.test(
        userAgent
      );

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);
    setIsInAppBrowser(inApp);

    // 5. Capture native Chrome/Edge install prompt if fired
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = sessionStorage.getItem("lvms_pwa_dismissed");
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. Mobile Fallback:
    // iOS Safari NEVER fires 'beforeinstallprompt'.
    // Android Chrome over local IP (HTTP) also suppresses 'beforeinstallprompt'.
    // We guarantee mobile users always see the install prompt after a short delay!
    const fallbackTimer = setTimeout(() => {
      const isDismissed = sessionStorage.getItem("lvms_pwa_dismissed");
      if (!isDismissed) {
        setShowPrompt(true);
      }
    }, 1500);

    // 7. Track successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setShowGuideModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 8. Custom event listener for manual triggers from topbar/menu
    const handleManualTrigger = () => {
      setShowGuideModal(true);
    };
    window.addEventListener("lvms:open-install-prompt", handleManualTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("lvms:open-install-prompt", handleManualTrigger);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    // If native 1-click prompt is supported and ready (e.g. Chrome on HTTPS/localhost)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setShowPrompt(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn("Native prompt error:", err);
      }
    }

    // If native 1-click prompt is not available (iOS Safari, Android on HTTP/LAN, or fallback),
    // open the tailored installation guide modal!
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("lvms_pwa_dismissed", "true");
    setShowPrompt(false);
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* ── Bottom Floating Install Banner ── */}
      {showPrompt && !showGuideModal && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                    Install LVMS Agent App
                  </h4>
                  <span className="text-[10px] bg-sky-500/20 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300/90 mt-0.5 line-clamp-2">
                  {isIOS
                    ? "Add to your iPhone Home Screen for full-screen mode & offline access."
                    : "Install on your phone for quick field access, GPS tracking & offline mode."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs px-3 sm:px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{deferredPrompt ? "Install" : "How to Install"}</span>
              </button>
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
      )}

      {/* ── Step-by-Step Installation Modal / Dialog ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 text-white rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/30">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Install LVMS App
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                      Mobile Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Run LVMS as a native full-screen app on your phone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-App Browser Warning (WhatsApp, Instagram, etc.) */}
            {isInAppBrowser && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-amber-200 text-xs">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300">
                    In-App Browser Detected
                  </p>
                  <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                    Tap the <strong>three dots (⋮)</strong> or <strong>Share</strong> button at the top/bottom and select <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong> to enable home-screen install.
                  </p>
                </div>
              </div>
            )}

            {/* Guide Steps */}
            <div className="space-y-3.5 my-2">
              {isIOS ? (
                /* iOS Safari Instructions */
                <>
                  <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <Share className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Step 1: Tap the Share button
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        In Safari's bottom toolbar, tap the square icon with an upward arrow (<strong>Share ⎋</strong>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Step 2: Tap "Add to Home Screen"
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Scroll down the menu list and tap <strong>"Add to Home Screen"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Step 3: Tap "Add"
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Tap <strong>"Add"</strong> in the top-right corner. The LVMS Agent app will appear on your iPhone screen!
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Android / General Instructions */
                <>
                  <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <MoreVertical className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Step 1: Tap Browser Menu
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Tap the <strong>three dots (⋮)</strong> in the top-right corner of Google Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Step 2: Select "Install App" or "Add to Home screen"
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200">
                        Step 3: Confirm "Install"
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Tap <strong>"Install"</strong> when prompted. The app will be placed directly in your phone's app list!
                      </p>
                    </div>
                  </div>

                  {!isSecure && (
                    <div className="bg-sky-950/60 border border-sky-800/50 rounded-2xl p-3 flex items-start gap-2.5 text-sky-200 text-xs mt-2">
                      <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sky-300">
                          Testing over local Wi-Fi / HTTP?
                        </p>
                        <p className="mt-0.5 text-sky-200/80 leading-relaxed">
                          Android Chrome suppresses automatic 1-click popups on local HTTP IPs (e.g. <code>http://192.168.x.x</code>). Tapping <strong>⋮ &rarr; Add to Home screen</strong> installs it right away!
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20 cursor-pointer text-center"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
