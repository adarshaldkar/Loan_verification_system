"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiGrid, FiUsers, FiUserCheck, FiBriefcase, FiUploadCloud,
  FiBarChart2, FiGitBranch, FiFileText, FiSettings, FiUser,
  FiLogOut, FiShield, FiChevronLeft, FiChevronRight,
  FiBell, FiSearch, FiMenu, FiCheckCircle, FiAlertCircle, FiInfo, FiMapPin, FiStar, FiSun, FiMoon
} from "react-icons/fi";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ─── Nav Items ──────────────────────────────────────────────────────────── */

const navItems = [
  { label: "Dashboard",    href: "/app",             icon: FiGrid },
  { label: "Customers",    href: "/app/customers",   icon: FiUsers },
  { label: "Agents",       href: "/app/agents",      icon: FiUserCheck },
  { label: "Live Tracking",href: "/app/tracking",    icon: FiMapPin },
  { label: "Admins",       href: "/app/admins",      icon: FiShield },
  { label: "Cases",        href: "/app/cases",       icon: FiBriefcase },
  { label: "Verification", href: "/app/verification", icon: FiStar },
  { label: "Excel Upload", href: "/app/upload",      icon: FiUploadCloud },
  { label: "Reports",      href: "/app/reports",     icon: FiBarChart2 },
  { label: "Branches",     href: "/app/branches",    icon: FiGitBranch },
  { label: "Audit Logs",   href: "/app/audit-logs",  icon: FiFileText },
  { label: "Settings",     href: "/app/settings",    icon: FiSettings },
  { label: "Profile",      href: "/app/profile",     icon: FiUser },
  { label: "Approved",     href: "/app/approved",    icon: FiCheckCircle },
];

/* ─── Sidebar Content ────────────────────────────────────────────────────── */

function SidebarContent({
  collapsed,
  pathname,
  onLogout,
}: {
  collapsed: boolean;
  pathname: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-border shrink-0",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-[#1E3A5F] flex items-center justify-center shrink-0">
          <FiShield className="text-white w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[13px] font-bold text-slate-900 leading-tight" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              LVMS
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">Loan Verification</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-blue-50 text-[#1E3A5F] font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  isActive ? "text-[#1E3A5F]" : "text-slate-400"
                )}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Logout */}
      <div className="p-2 shrink-0">
        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors duration-150",
            collapsed && "justify-center"
          )}
        >
          <FiLogOut className="w-5 h-5 shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}

/* ─── Top Bar ────────────────────────────────────────────────────────────── */

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminProfile, setAdminProfile] = useState<{ name: string; email: string; initials: string } | null>(null);
  const [theme, setTheme] = useState("light");
  const router = useRouter();

  useEffect(() => {
    // Theme setup
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    // Profile setup
    fetch('http://localhost:5000/api/v1/admin/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const firstName = res.data.firstName || '';
          const lastName = res.data.lastName || '';
          const name = res.data.name || `${firstName} ${lastName}`.trim() || 'Admin';
          const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'AD';
          setAdminProfile({ name, email: res.data.email || '', initials });
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Admin notifications are not yet fully wired to the backend
  const notifications: any[] = [];

  const quickLinks = [
    { label: "Dashboard",    href: "/app",             icon: FiGrid,        hint: "Overview" },
    { label: "Customers",    href: "/app/customers",   icon: FiUsers,       hint: "All customers" },
    { label: "Cases",        href: "/app/cases",       icon: FiBriefcase,   hint: "Verification cases" },
    { label: "Agents",       href: "/app/agents",      icon: FiUserCheck,   hint: "Field agents" },
    { label: "Live Tracking",href: "/app/tracking",    icon: FiMapPin,      hint: "Track active agents" },
    { label: "Excel Upload", href: "/app/upload",      icon: FiUploadCloud, hint: "Import data" },
    { label: "Reports",      href: "/app/reports",     icon: FiBarChart2,   hint: "Generate reports" },
    { label: "Branches",     href: "/app/branches",    icon: FiGitBranch,   hint: "Branch offices" },
    { label: "Audit Logs",   href: "/app/audit-logs",  icon: FiFileText,    hint: "Activity trail" },
    { label: "Settings",     href: "/app/settings",    icon: FiSettings,    hint: "System settings" },
    { label: "Profile",      href: "/app/profile",     icon: FiUser,        hint: "My account" },
    { label: "Approved",     href: "/app/approved",    icon: FiCheckCircle, hint: "Approved documents" },
  ];

  const filtered = quickLinks.filter(
    (l) =>
      searchQuery === "" ||
      l.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.hint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={(o) => { setSearchOpen(o); if (!o) setSearchQuery(""); }}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
            <FiSearch className="w-4 h-4 text-slate-400 shrink-0" />
            <Input
              autoFocus
              placeholder="Search pages, cases, agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 text-sm p-0 h-auto bg-transparent"
            />
            <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
          </div>
          <div className="py-2 max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">No results found</p>
            ) : (
              <>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Navigation
                </p>
                {filtered.map(({ label, href, icon: Icon, hint }) => (
                  <button
                    key={href}
                    onClick={() => { router.push(href); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#1E3A5F]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400">{hint}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-40 h-14 border-b border-border bg-white/90 backdrop-blur-sm flex items-center px-4 gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-md hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 text-sm hover:border-slate-300 hover:bg-white transition-colors text-left"
        >
          <FiSearch className="w-4 h-4 shrink-0" />
          <span>Search anything...</span>
          <span className="ml-auto flex items-center gap-0.5 text-[11px] text-slate-300 border border-slate-200 rounded px-1 py-0.5">
            ⌘K
          </span>
        </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors outline-none"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>
        {/* Notifications dropdown */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors outline-none"
            aria-label="Notifications"
          >
            <FiBell className="w-5 h-5" />
            {notifications.some((n) => n.unread) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1E3A5F] border-2 border-white" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {notifications.length > 0 && (
                <button
                  className="text-xs text-[#1E3A5F] hover:underline font-medium"
                  onClick={() => setNotifOpen(false)}
                >
                  Mark all read
                </button>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <FiBell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No new notifications
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-slate-50 cursor-pointer",
                    n.unread && "bg-blue-50/30"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", n.bg)}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-[#1E3A5F] mt-1.5 shrink-0" />}
                </div>
              ))
            )}
            
            <div className="px-4 py-3 text-center border-t border-border">
              <Link
                href="/app/audit-logs"
                className="text-xs font-medium text-[#1E3A5F] hover:underline"
                onClick={() => setNotifOpen(false)}
              >
                View all activity →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors outline-none">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" alt={adminProfile?.name || 'Admin'} />
              <AvatarFallback className="text-xs font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                {adminProfile?.initials || 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-semibold text-slate-900 leading-tight">{adminProfile?.name || 'Admin'}</p>
              <p className="text-[11px] text-slate-400 leading-tight">Admin</p>
            </div>
            <FiChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal pb-1">
                Signed in as
                <span className="block font-semibold text-slate-900">{adminProfile?.email || 'admin@lvms.com'}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/app/profile")}>
                <FiUser className="mr-2 w-4 h-4 text-slate-400" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/app/settings")}>
                <FiSettings className="mr-2 w-4 h-4 text-slate-400" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                onClick={() => router.push("/login")}
              >
                <FiLogOut className="mr-2 w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </header>
    </>
  );
}

/* ─── Admin Shell Layout ─────────────────────────────────────────────────── */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-200 ease-in-out relative",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} onLogout={handleLogout} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 shadow-sm transition-colors z-10"
        >
          {collapsed ? (
            <FiChevronRight className="w-3 h-3" />
          ) : (
            <FiChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* ── Mobile Sidebar (Sheet) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 lg:hidden">
          <SidebarContent collapsed={false} pathname={pathname} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* ── Main Area ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-6 py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white px-6 py-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>© 2026 Loan Verification Management System. All rights reserved.</span>
          <span>Version 1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
