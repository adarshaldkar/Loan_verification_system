"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiGrid, FiBriefcase, FiCheckSquare, FiBell, FiUser, FiLogOut,
  FiShield, FiMenu, FiX, FiChevronRight,
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ─── Mock Agent Session ─────────────────────────────────────────────────── */
const AGENT = {
  name: "Amit Kumar",
  id: "AGT-001",
  branch: "Bangalore HQ",
  initials: "AK",
};

/* ─── Nav ────────────────────────────────────────────────────────────────── */
const navItems = [
  { label: "Dashboard",          href: "/agent",               icon: FiGrid },
  { label: "Assigned Cases",     href: "/agent/cases",         icon: FiBriefcase },
  { label: "Verification",       href: "/agent/verify",        icon: FiCheckSquare },
  { label: "Notifications",      href: "/agent/notifications", icon: FiBell },
  { label: "Profile",            href: "/agent/profile",       icon: FiUser },
];

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <div className="flex flex-col h-full bg-[#0F2240]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-tight" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              LVMS Agent
            </p>
            <p className="text-[10px] text-blue-300 leading-tight">Field Portal</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-blue-300 hover:text-white lg:hidden">
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Agent badge */}
      <div className="mx-4 mt-4 mb-2 p-3 bg-white/8 rounded-xl border border-white/10">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs font-bold" style={{ background: "#1E3A5F", color: "#fff" }}>
              {AGENT.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{AGENT.name}</p>
            <p className="text-[10px] text-blue-300">{AGENT.branch}</p>
          </div>
          <span className="text-[9px] font-mono text-blue-400">{AGENT.id}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/agent" ? pathname === "/agent" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                isActive
                  ? "bg-white/15 text-white font-semibold"
                  : "text-blue-200 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-blue-300")} />
              <span className="flex-1">{label}</span>
              {isActive && <FiChevronRight className="w-3.5 h-3.5 text-blue-300" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => router.push("/agent/login")}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-all"
        >
          <FiLogOut className="w-4.5 h-4.5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

/* ─── Agent Layout ───────────────────────────────────────────────────────── */
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-40 bg-[#0F2240] px-4 h-14 flex items-center justify-between border-b border-white/10">
          <button onClick={() => setMobileOpen(true)} className="text-white p-1">
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FiShield className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              LVMS Agent
            </span>
          </div>
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-[10px] font-bold" style={{ background: "#1E3A5F", color: "#fff" }}>
              {AGENT.initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
