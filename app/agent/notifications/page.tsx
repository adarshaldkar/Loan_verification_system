"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FiBell, FiBriefcase, FiCheckCircle, FiAlertTriangle, FiInfo, FiRefreshCw,
  FiArrowRight, FiCheck, FiTrash2, FiSearch, FiX, FiClock, FiMapPin, FiPhone
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentNotificationsApi } from "@/lib/api";

type NotifType = "ASSIGNMENT" | "APPROVED" | "REJECTED" | "RE_VERIFICATION" | "INFO";

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; badge: string; label: string }> = {
  ASSIGNMENT:      { icon: FiBriefcase,     color: "#1E4DB7", bg: "#EFF6FF", badge: "bg-blue-100 text-blue-800", label: "New Assignment" },
  APPROVED:        { icon: FiCheckCircle,   color: "#0D9488", bg: "#F0FDF4", badge: "bg-emerald-100 text-emerald-800", label: "Approved & Verified" },
  REJECTED:        { icon: FiAlertTriangle, color: "#E11D48", bg: "#FFF1F2", badge: "bg-rose-100 text-rose-800", label: "Declined" },
  RE_VERIFICATION: { icon: FiAlertTriangle, color: "#D97706", bg: "#FFFBEB", badge: "bg-amber-100 text-amber-800", label: "Action Required" },
  INFO:            { icon: FiInfo,          color: "#6366F1", bg: "#EEF2FF", badge: "bg-indigo-100 text-indigo-800", label: "Status Update" },
};

type NotificationItem = {
  id: string;
  type: NotifType;
  priority: "High" | "Medium" | "Low";
  title: string;
  body: string;
  customerName?: string;
  phone?: string;
  loanType?: string;
  time: string;
  unread: boolean;
  caseId?: string;
  applicationId?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"All" | "Unread" | "ASSIGNMENT" | "APPROVED" | "RE_VERIFICATION">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadNotifications(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getAgentNotificationsApi();
      const data = res.data?.data || [];
      const mapped: NotificationItem[] = data.map((n: any) => ({
        id: n.id,
        type: (n.type as NotifType) || "INFO",
        priority: n.priority || "Low",
        title: n.title,
        body: n.body,
        customerName: n.customerName,
        phone: n.phone,
        loanType: n.loanType,
        time: n.time,
        unread: !n.read,
        caseId: n.caseId,
        applicationId: n.applicationId,
      }));
      setNotifications(mapped);
      if (isManual) toast.success("Notifications refreshed");
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const assignmentCount = notifications.filter((n) => n.type === "ASSIGNMENT").length;
  const actionCount = notifications.filter((n) => n.type === "RE_VERIFICATION").length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success("All notifications marked as read");
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification dismissed");
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.customerName && n.customerName.toLowerCase().includes(q)) ||
        (n.applicationId && n.applicationId.toLowerCase().includes(q));

      const matchFilter =
        filter === "All" ||
        (filter === "Unread" && n.unread) ||
        n.type === filter;

      return matchSearch && matchFilter;
    });
  }, [notifications, filter, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            Activity & Notifications 🔔
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Real-time verification alerts, case assignments, and verification status updates ({unreadCount} unread)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-50 text-[#1E4DB7] hover:bg-blue-100 dark:bg-slate-900 dark:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FiCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className={cn("w-3.5 h-3.5 text-[#1E4DB7]", refreshing && "animate-spin")} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary Tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter("All")}
          className={cn(
            "bg-white dark:bg-slate-950 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            filter === "All" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-blue-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <span className="text-[11px] font-semibold text-gray-400 block">Total Alerts</span>
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-1">{notifications.length}</p>
        </div>

        <div
          onClick={() => setFilter("Unread")}
          className={cn(
            "bg-white dark:bg-slate-950 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            filter === "Unread" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-blue-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <span className="text-[11px] font-semibold text-gray-400 block">Unread Alerts</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{unreadCount}</p>
        </div>

        <div
          onClick={() => setFilter("ASSIGNMENT")}
          className={cn(
            "bg-white dark:bg-slate-950 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            filter === "ASSIGNMENT" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-blue-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <span className="text-[11px] font-semibold text-gray-400 block">New Assignments</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{assignmentCount}</p>
        </div>

        <div
          onClick={() => setFilter("RE_VERIFICATION")}
          className={cn(
            "bg-white dark:bg-slate-950 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            filter === "RE_VERIFICATION" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-blue-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <span className="text-[11px] font-semibold text-gray-400 block">Action Required</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{actionCount}</p>
        </div>
      </div>

      {/* ── 3. Search & Category Filters ── */}
      <div className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notification title, customer name, address, or application ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-8 py-2 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "All", label: "All Alerts", count: notifications.length },
            { id: "Unread", label: "Unread", count: unreadCount },
            { id: "ASSIGNMENT", label: "Assignments", count: assignmentCount },
            { id: "APPROVED", label: "Approved", count: notifications.filter(n => n.type === "APPROVED").length },
            { id: "RE_VERIFICATION", label: "Action Required", count: actionCount },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id as any)}
              className={cn(
                "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5",
                filter === pill.id
                  ? "bg-[#1E4DB7] text-white border-[#1E4DB7] shadow-sm"
                  : "bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100"
              )}
            >
              <span>{pill.label}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                filter === pill.id ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
              )}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Notifications List ── */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E4DB7] flex items-center justify-center mx-auto">
            <FiBell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">No notifications found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || filter !== "All"
                ? "Try clearing your search or switching to another filter."
                : "You're all caught up! No recent activity notifications."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = cfg.icon;

            return (
              <div
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.caseId) {
                    router.push(`/agent/cases/${n.caseId}`);
                  }
                }}
                className={cn(
                  "p-4 bg-white dark:bg-slate-950 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-blue-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group",
                  n.unread
                    ? "border-l-4 border-l-[#1E4DB7] bg-blue-50/20 dark:bg-slate-900/40"
                    : "border-gray-100 dark:border-slate-800"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", cfg.badge)}>
                        {cfg.label}
                      </span>
                      {n.applicationId && (
                        <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {n.applicationId}
                        </span>
                      )}
                      {n.unread && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> NEW
                        </span>
                      )}
                    </div>

                    <h4 className="text-[14px] font-bold text-gray-900 dark:text-slate-100 leading-snug group-hover:text-[#1E4DB7] transition-colors">
                      {n.title}
                    </h4>

                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                      <FiMapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{n.body}</span>
                    </p>

                    <div className="flex items-center gap-3 pt-0.5 text-[10px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {n.time}
                      </span>
                      {n.phone && <span>📞 {n.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {n.caseId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/agent/verify/${n.caseId}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#1E4DB7] hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <span>Open Workspace</span>
                      <FiArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => deleteNotification(e, n.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Dismiss"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
