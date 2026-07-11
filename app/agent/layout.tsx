"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiGrid, FiBriefcase, FiCheckSquare, FiBell, FiUser, FiLogOut,
  FiShield, FiMenu, FiX, FiRefreshCw, FiWifi, FiWifiOff,
  FiMapPin, FiChevronDown, FiUploadCloud,
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { agentLogoutApi } from "@/lib/api";
import { toast } from "sonner";

const AGENT = { name: "Arun Kumar", id: "AGT-1024", initials: "AK" };

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  danger?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard",           href: "/agent",               icon: FiGrid },
      { label: "Assigned Cases",      href: "/agent/cases",         icon: FiBriefcase },
      { label: "Verification Process",href: "/agent/verify",        icon: FiCheckSquare },
    ],
  },
  {
    title: "ACTIVITY",
    items: [
      { label: "Notifications",       href: "/agent/notifications", icon: FiBell, badge: 2 },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Profile",             href: "/agent/profile",       icon: FiUser },
      { label: "Logout",              href: "/agent/login",         icon: FiLogOut, danger: true },
    ],
  },
];

function Sidebar({ onClose, onLogout }: { onClose?: () => void; onLogout?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1E4DB7" }}>
            <FiShield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-900 leading-tight" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              LVMS
            </p>
            <p className="text-[10px] text-gray-400">Agent Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 lg:hidden">
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold text-gray-400 px-3 mb-1.5 tracking-widest">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon, badge, danger }) => {
                const isActive = href === "/agent" ? pathname === "/agent" : pathname.startsWith(href);
                if (danger) {
                  return (
                    <button
                      key={href}
                      onClick={() => { onClose?.(); onLogout?.(); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    style={isActive ? { background: "#1E4DB7" } : {}}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge !== undefined && (
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={isActive ? { background: "rgba(255,255,255,0.25)", color: "white" } : { background: "#EF4444", color: "white" }}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
          <span className="text-[10px] text-gray-400">Last sync: 2 mins ago</span>
          <button className="text-gray-400 hover:text-gray-600">
            <FiRefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Topbar ── */
function Topbar({ onMenu }: { onMenu: () => void }) {
  const [offline, setOffline] = useState(false);
  const [gps, setGps]         = useState(true);
  const [agent, setAgent]     = useState({ name: "Loading...", id: "---", initials: "" });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lvms_agent");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setAgent({
            name: `${user.firstName} ${user.lastName}`,
            id: user.id.slice(0, 8).toUpperCase(),
            initials: `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
          });
        } catch (e) {}
      }
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
      <button onClick={onMenu} className="text-gray-500 hover:text-gray-800 lg:hidden">
        <FiMenu className="w-5 h-5" />
      </button>
      <button onClick={onMenu} className="hidden lg:block text-gray-500 hover:text-gray-800">
        <FiMenu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Offline mode toggle */}
      <button
        onClick={() => setOffline(!offline)}
        className={cn(
          "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
          offline ? "border-amber-300 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-600"
        )}
      >
        {offline ? <FiWifiOff className="w-3.5 h-3.5" /> : <FiUploadCloud className="w-3.5 h-3.5" />}
        {offline ? "Offline Mode" : "Offline Mode"}
      </button>

      {/* GPS */}
      <button
        onClick={() => setGps(!gps)}
        className={cn(
          "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
          gps ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", gps ? "bg-green-500" : "bg-gray-400")} />
        <FiMapPin className="w-3.5 h-3.5" />
        GPS {gps ? "Enabled" : "Disabled"}
      </button>

      {/* Bell */}
      <Link href="/agent/notifications" className="relative p-2 text-gray-500 hover:text-gray-800">
        <FiBell className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">2</span>
      </Link>

      {/* Avatar */}
      <Link href="/agent/profile" className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-all">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs font-bold text-white" style={{ background: "#1E4DB7" }}>
            {agent.initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-[12px] font-semibold text-gray-900 leading-tight">{agent.name}</p>
          <p className="text-[10px] text-gray-400">Agent ID: {agent.id}</p>
        </div>
        <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </Link>
    </header>
  );
}

/* ── Layout ── */
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (pathname === "/agent/login") {
      setCheckingAuth(false);
      return;
    }
    const agentStr = localStorage.getItem("lvms_agent");
    if (!agentStr) {
      router.push("/agent/login");
    } else {
      setCheckingAuth(false);
    }
  }, [pathname, router]);

  const isLoginPage = pathname === "/agent/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#F4F6FB]">{children}</div>;
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F4F6FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1E4DB7] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 sticky top-0 h-screen shadow-sm transition-all duration-300 ease-in-out bg-white border-r border-gray-100",
          sidebarOpen ? "w-56" : "w-0 overflow-hidden border-r-0"
        )}
      >
        <Sidebar onLogout={() => setShowLogoutDialog(true)} />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 h-full z-10 shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} onLogout={() => setShowLogoutDialog(true)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowLogoutDialog(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <FiLogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Confirm Logout</h3>
              <p className="text-xs text-gray-500 mt-1">Are you sure you want to log out of your session?</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                NO
              </button>
              <button
                onClick={async () => {
                  try {
                    await agentLogoutApi();
                  } catch (e) {
                    console.error("Error calling logout api:", e);
                  }
                  localStorage.removeItem("lvms_agent");
                  setShowLogoutDialog(false);
                  router.push("/agent/login");
                  toast.success("Successfully logged out");
                }}
                className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "#EF4444" }}
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
