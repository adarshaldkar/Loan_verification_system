"use client";

import { useState, useEffect } from "react";
import {
  FiBell, FiBriefcase, FiCheckCircle, FiAlertTriangle, FiInfo, FiRefreshCw,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { getAgentNotificationsApi } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type NotifType = "ASSIGNMENT" | "APPROVED" | "REJECTED" | "REMINDER" | "INFO";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ASSIGNMENT: { icon: FiBriefcase,    color: "#1E3A5F", bg: "#EEF2FF" },
  APPROVED:   { icon: FiCheckCircle,  color: "#0D9488", bg: "#CCFBF1" },
  REJECTED:   { icon: FiAlertTriangle, color: "#DC2626", bg: "#FEE2E2" },
  REMINDER:   { icon: FiRefreshCw,    color: "#D97706", bg: "#FEF3C7" },
  INFO:       { icon: FiInfo,         color: "#6366F1", bg: "#EEF2FF" },
};

/* ─── Notifications Page ─────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Unread">("All");

  useEffect(() => {
    getAgentNotificationsApi()
      .then((res) => {
        setNotifications(res.data.data || []);
      })
      .catch((err) => {
        toast.error("Failed to load notifications");
      })
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function markAllRead() {
    // In a real app, you'd call an API like `markAllNotificationsReadApi` here
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function markRead(id: string) {
    // In a real app, you'd call an API like `markNotificationReadApi(id)` here
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  const filtered = notifications.filter((n) => filter === "All" || !n.isRead);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-[#1E3A5F]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="40" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#1E3A5F", background: "#EEF2FF" }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["All", "Unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-full transition-all",
              filter === f ? "text-white" : "bg-white text-slate-500 border border-slate-200"
            )}
            style={filter === f ? { background: "#1E3A5F" } : {}}
          >
            {f} {f === "Unread" && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <FiBell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No {filter === "Unread" ? "unread " : ""}notifications</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "w-full bg-white rounded-2xl p-4 text-left shadow-sm transition-all active:scale-[0.99]",
                  !n.isRead && "border-l-4"
                )}
                style={!n.isRead ? { borderColor: cfg.color } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-slate-900">{n.title}</p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: cfg.color }} />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
