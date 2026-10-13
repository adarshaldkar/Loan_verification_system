"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export async function triggerPwaInstall() {
  if (typeof window === "undefined") return;
  const prompt = (window as any).__lvms_deferred_prompt;
  if (prompt) {
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        (window as any).__lvms_deferred_prompt = null;
      }
      return;
    } catch (err) {
      console.warn("Native prompt trigger failed:", err);
    }
  }
  window.dispatchEvent(new CustomEvent("lvms:open-install-prompt"));
}

interface InstallAppButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "subtle" | "banner";
  label?: string;
  sublabel?: string;
}

export default function InstallAppButton({
  className,
  variant = "secondary",
  label = "Install App on Phone",
  sublabel,
}: InstallAppButtonProps) {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsInstalled(standalone);

    const handleInstalled = () => setIsInstalled(true);
    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  if (isInstalled) {
    return (
      <div className={cn("flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl", className)}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>LVMS App Installed</span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <button
        type="button"
        onClick={triggerPwaInstall}
        className={cn(
          "w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 border border-sky-500/30 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.99] group cursor-pointer shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                {label}
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded border border-sky-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {sublabel || "Quick 1-click home screen install for mobile officers"}
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm group-hover:bg-sky-400 transition-colors shrink-0">
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={triggerPwaInstall}
      className={cn(
        "w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]",
        variant === "primary"
          ? "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20"
          : variant === "subtle"
          ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          : "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60",
        className
      )}
    >
      <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
      <span>{label}</span>
      <span className="text-[10px] bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold px-1.5 py-0.5 rounded border border-sky-500/20">
        PWA
      </span>
    </button>
  );
}
