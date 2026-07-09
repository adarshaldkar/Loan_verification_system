"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw,
  FiMapPin, FiArrowRight, FiBell, FiChevronRight, FiNavigation,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

const stats = [
  { label: "Assigned",     value: 8,   icon: FiBriefcase,   color: "#1E3A5F", bg: "#EEF2FF" },
  { label: "In Progress",  value: 2,   icon: FiClock,       color: "#D97706", bg: "#FEF3C7" },
  { label: "Completed",    value: 23,  icon: FiCheckCircle, color: "#0D9488", bg: "#CCFBF1" },
  { label: "Re-verify",    value: 1,   icon: FiRefreshCw,   color: "#DC2626", bg: "#FEE2E2" },
];

const currentTask = {
  id: "LV-2026-10821",
  customer: "Priya Sharma",
  type: "Residential Verification",
  address: "45, Park St, Dadar West, Mumbai — 400028",
  priority: "High",
  status: "ASSIGNED",
  distance: "3.2 km",
  lat: 19.018255,
  lng: 72.847145,
};

const recentActivity = [
  { id: "LV-2026-10818", customer: "Amit Kumar",    action: "Verification Submitted",    time: "10 min ago",  color: "#0D9488" },
  { id: "LV-2026-10815", customer: "Kavita Singh",   action: "Case Completed — Approved", time: "2 hrs ago",   color: "#1E3A5F" },
  { id: "LV-2026-10812", customer: "Sandeep Yadav",  action: "Draft Saved",               time: "Yesterday",   color: "#D97706" },
  { id: "LV-2026-10810", customer: "Neha Verma",     action: "Re-verification Required",  time: "2 days ago",  color: "#DC2626" },
];

const notifications = [
  { msg: "New case LV-2026-10821 assigned to you", time: "10 min ago", unread: true },
  { msg: "Case LV-2026-10815 approved by Admin",   time: "2 hrs ago",  unread: true },
  { msg: "Reminder: Case LV-2026-10819 is overdue", time: "5 hrs ago", unread: false },
];

/* ─── Status Badge ───────────────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ASSIGNED:              { label: "Assigned",            color: "#1E3A5F", bg: "#EEF2FF" },
    TRAVELLING:            { label: "Travelling",          color: "#7C3AED", bg: "#EDE9FE" },
    AT_LOCATION:           { label: "At Location",         color: "#0D9488", bg: "#CCFBF1" },
    IN_PROGRESS:           { label: "In Progress",         color: "#D97706", bg: "#FEF3C7" },
    SUBMITTED:             { label: "Submitted",           color: "#1E3A5F", bg: "#DBEAFE" },
    COMPLETED:             { label: "Completed",           color: "#0D9488", bg: "#CCFBF1" },
    RE_VERIFICATION:       { label: "Re-verify",           color: "#DC2626", bg: "#FEE2E2" },
  };
  const s = map[status] ?? { label: status, color: "#64748B", bg: "#F1F5F9" };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function AgentDashboard() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Good Morning, Amit 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Thursday, 10 July 2026 · Bangalore HQ</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          const isActive = activeFilter === s.label;
          return (
            <button
              key={s.label}
              onClick={() => {
                setActiveFilter(isActive ? null : s.label);
                router.push("/agent/cases");
              }}
              className={cn(
                "bg-white rounded-2xl p-4 text-left transition-all duration-150 active:scale-95 shadow-sm border-2",
                isActive ? "border-[#1E3A5F]" : "border-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                </div>
                <FiChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {s.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Avg Time ── */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A5298] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-blue-200 mb-0.5">Avg. Completion Time</p>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-plus-jakarta)" }}>1.4 days</p>
          <p className="text-xs text-blue-300 mt-0.5">↑ 12% better than last week</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <FiClock className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* ── Current Task ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Current Task
          </h2>
          <Link href="/agent/cases" className="text-xs font-medium" style={{ color: "#1E3A5F" }}>
            View all →
          </Link>
        </div>
        <button
          onClick={() => router.push(`/agent/cases/${currentTask.id}`)}
          className="w-full bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-mono text-slate-400">{currentTask.id}</p>
              <p className="text-[15px] font-semibold text-slate-900 mt-0.5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {currentTask.customer}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{currentTask.type}</p>
            </div>
            <StatusPill status={currentTask.status} />
          </div>
          <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
            <FiMapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">{currentTask.address}</p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <FiNavigation className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">{currentTask.distance} away</span>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1",
                currentTask.priority === "High" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
              )}>
                {currentTask.priority}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#1E3A5F" }}>
              Open <FiArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      </div>

      {/* ── Notifications ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Notifications
          </h2>
          <Link href="/agent/notifications" className="text-xs font-medium" style={{ color: "#1E3A5F" }}>
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {notifications.slice(0, 2).map((n, i) => (
            <div key={i} className={cn("bg-white rounded-xl p-3 flex items-start gap-3 shadow-sm", n.unread && "border-l-4")} style={n.unread ? { borderColor: "#1E3A5F" } : {}}>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <FiBell className="w-4 h-4 text-[#1E3A5F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-snug">{n.msg}</p>
                <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
              </div>
              {n.unread && <span className="w-2 h-2 rounded-full bg-[#1E3A5F] mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <h2 className="text-[14px] font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Recent Activity
        </h2>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5">
              <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: a.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900">{a.action}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{a.customer} · <span className="font-mono">{a.id}</span></p>
              </div>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">{a.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
