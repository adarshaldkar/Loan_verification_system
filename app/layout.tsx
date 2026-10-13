import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PageAnalyticsTracker from "@/components/analytics/PageAnalyticsTracker";
import "./globals.css";

/* ─── Font Definitions ───────────────────────────────────────────────────── */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* ─── Viewport Configuration ─────────────────────────────────────────────── */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3a5f",
};

/* ─── Metadata ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default: "Sky Line Risk Audit Services — LVMS",
    template: "%s | Sky Line Risk Audit Services",
  },
  description:
    "Sky Line Risk Audit Services — Enterprise loan verification platform for field operations and risk audit management.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sky Line Risk",
  },
  icons: {
    icon: "/logo-icon.png",
    shortcut: "/logo-icon.png",
    apple: "/icons/icon-192.png",
  },
};

/* ─── Root Layout ────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full antialiased" suppressHydrationWarning>
        <TooltipProvider>
          <PageAnalyticsTracker />
          {children}
          <PwaInstallPrompt />
          <Toaster position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}

