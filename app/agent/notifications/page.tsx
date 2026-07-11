"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FiBell, FiBriefcase, FiCheckCircle, FiAlertTriangle, FiInfo, FiRefreshCw,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentNotificationsApi } from "@/lib/api";

type NotifType = "ASSIGNMENT" | "APPROVED" | "REJECTED" | "REMINDER" | "INFO";

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  ASSIGNMENT: { icon: FiBriefcase,    color: "#1E3A5F", bg: "#EEF2FF" },
  APPROVED:   { icon: FiCheckCircle,  color: "#0D9488", bg: "#CCFBF1" },
  REJECTED:   { icon: FiAlertTriangle, color: "#DC2626", bg: "#FEE2E2" },
  REMINDER:   { icon: FiRefreshCw,    color: "#D97706", bg: "#FEF3C7" },
  INFO:       { icon: FiInfo,         color: "#6366F1", bg: "#EEF2FF" },
};

type NotificationItem = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  caseId?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"All" | "Unread">("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await getAgentNotificationsApi();
        const data = res.data?.data || [];
        // Map backend format to frontend UI format
        const mapped: NotificationItem[] = data.map((n: any) => ({
          id: n.id,
          type: n.type === "new_case" ? "ASSIGNMENT" : "INFO",
          title: n.title,
          message: n.body,
          time: n.time,
          unread: !n.read,
          caseId: n.caseId,
        }));
        setNotifications(mapped);
      } catch (error) {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>

        {/* List skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  }

  const filtered = notifications.filter((n) => filter === "All" || n.unread);

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
              filter === f ? "text-white" : "bg-white dark:bg-slate-950 text-slate-500 border border-slate-200"
            )}
            style={filter === f ? { background: "#1E3A5F" } : {}}
          >
            {f} {f === "Unread" && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-10 text-center shadow-sm">
          <FiBell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No {filter === "Unread" ? "unread " : ""}notifications</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.caseId) {
                    toast.info(`Opening case...`);
                    router.push(`/agent/cases/${n.caseId}`);
                  }
                }}
                className={cn(
                  "w-full bg-white dark:bg-slate-950 rounded-2xl p-4 text-left shadow-sm transition-all active:scale-[0.99] border hover:border-slate-200",
                  n.unread && "border-l-4"
                )}
                style={n.unread ? { borderColor: cfg.color } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-slate-900">{n.title}</p>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: cfg.color }} />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">{n.time}</p>
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
