"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  FiUsers, FiBriefcase, FiClock, FiCheckCircle,
  FiUserCheck, FiGitBranch, FiFile, FiUploadCloud, FiUserPlus, FiCalendar, FiChevronDown, FiXCircle, FiRefreshCw,
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge, type VerificationStatus } from "@/components/shared/status-badge";
import { SectionCard } from "@/components/shared/section-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { getAnalyticsApi, getDashboardApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Static fallback activity icons map ─────────────────────────────────── */
const ICON_MAP: Record<string, React.ReactNode> = {
  success: <FiCheckCircle className="w-4 h-4" style={{ color: "#0D9488" }} />,
  info:    <FiBriefcase className="w-4 h-4" style={{ color: "#1D4ED8" }} />,
  upload:  <FiUploadCloud className="w-4 h-4" style={{ color: "#1E3A5F" }} />,
  activity:<FiUserPlus className="w-4 h-4 text-amber-700" />,
};

const STATIC_ACTIVITY = [
  { icon: "success", bg: "bg-teal-50 dark:bg-slate-800",  title: "Verification completed",  desc: "System is ready",   time: "Just now" },
  { icon: "info",    bg: "bg-blue-50 dark:bg-slate-800",  title: "New case pending",         desc: "No cases yet",      time: "—" },
  { icon: "upload",  bg: "bg-blue-50 dark:bg-slate-800",  title: "System initialized",       desc: "Database synced",   time: "—" },
  { icon: "activity",bg: "bg-amber-50 dark:bg-slate-800",  title: "Admin logged in",          desc: "Welcome back!",     time: "Just now" },
];

/* ─── Static chart seed data (visual only) ───────────────────────────────── */
const lineData = [
  { date: "12 May", total: 980,  completed: 620, pending: 280, rejected: 80  },
  { date: "13 May", total: 1120, completed: 700, pending: 310, rejected: 110 },
  { date: "14 May", total: 1050, completed: 650, pending: 290, rejected: 110 },
  { date: "15 May", total: 2100, completed: 1350, pending: 580, rejected: 170 },
  { date: "16 May", total: 1750, completed: 1050, pending: 500, rejected: 200 },
  { date: "17 May", total: 1900, completed: 1200, pending: 520, rejected: 180 },
  { date: "18 May", total: 2050, completed: 1300, pending: 540, rejected: 210 },
];

const CHART_PERIOD_OPTIONS = ["This Week", "Last Week", "This Month"];

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-md px-4 py-3 text-xs">
      <p className="font-semibold text-slate-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-slate-900">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

const DATE_RANGES = [
  { label: "Today",          value: "09 Jul 2026" },
  { label: "Last 7 days",    value: "02 Jul – 09 Jul 2026" },
  { label: "This Week",      value: "07 Jul – 13 Jul 2026" },
  { label: "Last Week",      value: "30 Jun – 06 Jul 2026" },
  { label: "This Month",     value: "01 Jul – 09 Jul 2026" },
  { label: "Last Month",     value: "01 Jun – 30 Jun 2026" },
  { label: "Custom Range",   value: "12 May – 18 May 2026" },
];

/* ─── Dashboard Page ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [period, setPeriod] = useState("This Week");
  const [dateRange, setDateRange] = useState(DATE_RANGES[2]);
  const [calOpen, setCalOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // ── Live Data State ──────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>(STATIC_ACTIVITY);
  const [liveLineData, setLiveLineData] = useState<any[]>(lineData);
  const [livePieData, setLivePieData] = useState<any[] | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [adminName, setAdminName] = useState('Admin');
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [adminPerformance, setAdminPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/v1/admin/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setAdminName(res.data.firstName || res.data.name?.split(' ')[0] || 'Admin');
          setCurrentUserEmail(res.data.email || "");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          getDashboardApi(),
          getAnalyticsApi(),
        ]);
        const dash = dashRes.data.data;
        setAnalytics(analyticsRes.data.data);
        setRecentCases(dash.recentCases ?? []);
        setTopAgents(dash.topAgents ?? []);
        setAdminPerformance(dash.adminPerformance ?? []);
        if (dash.recentActivity?.length) setRecentActivity(dash.recentActivity);
        if (dash.lineData?.length) setLiveLineData(dash.lineData);
        if (dash.pieData?.length) setLivePieData(dash.pieData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadDashboard();
  }, []);

  // Compute live KPI values from analytics
  const totalCases = analytics?.caseBreakdown?.reduce((sum: number, c: any) => sum + c.count, 0) ?? 0;
  const pendingCount = (analytics?.caseBreakdown?.find((c: any) => c.status === "PENDING")?.count ?? 0) +
                       (analytics?.caseBreakdown?.find((c: any) => c.status === "ASSIGNED")?.count ?? 0);
  const completedCount = (analytics?.caseBreakdown?.find((c: any) => c.status === "COMPLETED")?.count ?? 0) +
                         (analytics?.caseBreakdown?.find((c: any) => c.status === "APPROVED")?.count ?? 0);

  const isSuperAdmin = currentUserEmail === "akshaya@gmail.com" || currentUserEmail === "adarshaldkar@gmail.com";

  const kpiData = [
    { label: "Total Customers", value: analytics?.totalCustomers ?? 0,  icon: <FiUsers />,        iconBg: "bg-blue-50 dark:bg-slate-800",    trend: 15.3 },
    { label: "Total Cases",     value: totalCases,                       icon: <FiBriefcase />,    iconBg: "bg-purple-50 dark:bg-slate-800",  trend: 12.1 },
    { label: "Pending Cases",   value: pendingCount,                     icon: <FiClock />,        iconBg: "bg-amber-50 dark:bg-slate-800",   trend: 8.5  },
    { label: "Completed Cases", value: completedCount,                   icon: <FiCheckCircle />,  iconBg: "bg-teal-50 dark:bg-slate-800",    trend: 18.7 },
    { label: "Active Agents",   value: analytics?.totalAgents ?? 0,     icon: <FiUserCheck />,    iconBg: "bg-indigo-50 dark:bg-slate-800",  trend: 9.4  },
    { label: "Branches",        value: analytics?.totalBranches ?? 0,                     icon: <FiGitBranch />,    iconBg: "bg-slate-100 dark:bg-slate-800",  trend: 0    },
    { label: "Rejected Cases",  value: analytics?.caseBreakdown?.find((c: any) => c.status === "REJECTED")?.count ?? 0, icon: <FiXCircle className="text-rose-600" />, iconBg: "bg-rose-50 dark:bg-slate-800", trend: 0 },
    { label: "Re-verification", value: analytics?.reverificationCount ?? 0, icon: <FiRefreshCw className="text-orange-600" />, iconBg: "bg-orange-50 dark:bg-slate-800", trend: 0 },
  ];

  const pieData = [
    { name: "Pending",     value: pendingCount, color: "#B45309" },
    { name: "In Progress", value: analytics?.caseBreakdown?.find((c: any) => c.status === "IN_PROGRESS")?.count ?? 0, color: "#1D4ED8" },
    { name: "Completed",   value: completedCount, color: "#0D9488" },
    { name: "Rejected",    value: analytics?.caseBreakdown?.find((c: any) => c.status === "REJECTED")?.count ?? 0, color: "#BE123C" },
  ];

  if (loadingStats) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-flat p-4 space-y-3 bg-white border border-border rounded-xl">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card-flat p-5 bg-white border border-border rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-[280px] w-full" />
          </div>
          <div className="card-flat p-5 bg-white border border-border rounded-xl space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex justify-center py-4">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>

        {/* Bottom grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-flat p-5 bg-white border border-border rounded-xl space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="card-flat p-5 bg-white border border-border rounded-xl space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${adminName}! Here's what's happening today.`}
        action={
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger className="flex items-center gap-2 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-600 bg-white hover:border-slate-300 transition-colors outline-none">
              <FiCalendar className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{dateRange.value}</span>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                Select Range
              </p>
              {DATE_RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => {
                    if (r.label !== "Custom Range") {
                      setDateRange(r);
                      setCalOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    dateRange.label === r.label
                      ? "bg-blue-50 text-[#1E3A5F] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {r.label}
                  {r.label !== "Custom Range" && (
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{r.value}</span>
                  )}
                </button>
              ))}
              {/* Custom Range inputs */}
              <div className="px-3 pt-1 pb-2 border-t border-slate-100 mt-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Custom Range</p>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                  <button
                    onClick={() => {
                      if (customFrom && customTo) {
                        const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                        setDateRange({ label: "Custom Range", value: `${fmt(customFrom)} – ${fmt(customTo)}` });
                        setCalOpen(false);
                      }
                    }}
                    disabled={!customFrom || !customTo}
                    className="w-full text-xs text-white rounded-lg py-1.5 font-semibold transition-colors disabled:opacity-40"
                    style={{ background: "#1E3A5F" }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
        {kpiData.map((kpi) => (
          <StatsCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="lg:col-span-2 card-flat p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Verification Cases Overview
            </h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[--color-brand-900]"
            >
              {CHART_PERIOD_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={liveLineData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line name="Total Cases" dataKey="total"     stroke="#1E3A5F" strokeWidth={2} dot={false} />
              <Line name="Completed"  dataKey="completed"  stroke="#0D9488" strokeWidth={2} dot={false} />
              <Line name="Pending"    dataKey="pending"    stroke="#B45309" strokeWidth={2} dot={false} />
              <Line name="Rejected"   dataKey="rejected"   stroke="#BE123C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            {[
              { color: "#1E3A5F", label: "Total Cases" },
              { color: "#0D9488", label: "Completed" },
              { color: "#B45309", label: "Pending" },
              { color: "#BE123C", label: "Rejected" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart + Activity */}
        <div className="flex flex-col gap-4">
          {/* Donut */}
          <div className="card-flat p-5">
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Cases by Status
            </h2>
            <div className="relative flex justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={livePieData ?? pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {(livePieData ?? pieData).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [Number(v).toLocaleString()]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  {(livePieData ?? pieData).reduce((s: number, d: any) => s + d.value, 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400">Total</p>
              </div>
            </div>
            {/* Legend rows */}
            <div className="mt-3 space-y-1.5">
              {(livePieData ?? pieData).map(({ name, value, color }: any) => {
                const total = (livePieData ?? pieData).reduce((s: number, d: any) => s + d.value, 0);
                const pct = total === 0 ? "0.0" : ((value / total) * 100).toFixed(1);
                return (
                  <div key={name} className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      {name}
                    </div>
                    <span className="font-medium text-slate-900">
                      {value.toLocaleString()} <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Performance (Super Admin Only) ── */}
      {isSuperAdmin && adminPerformance.length > 0 && (
        <SectionCard title="Administrators Performance Overview">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cases</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider text-amber-700">Pending</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider text-teal-700">Completed</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider text-emerald-800">Verified (Approved)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider text-rose-700">Rejected</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider text-orange-700">Re-verification</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider font-bold">Overall Verifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adminPerformance.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-3">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                          {admin.name.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {admin.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{admin.email}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700">{admin.total}</td>
                    <td className="px-4 py-3.5 text-center text-amber-700">{admin.pending}</td>
                    <td className="px-4 py-3.5 text-center text-teal-700">{admin.completed}</td>
                    <td className="px-4 py-3.5 text-center text-emerald-800">{admin.verified}</td>
                    <td className="px-4 py-3.5 text-center text-rose-700">{admin.rejected ?? 0}</td>
                    <td className="px-4 py-3.5 text-center text-orange-700">{admin.reverification ?? 0}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-900">{admin.overall}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Bottom Row: Top Agents Performance ── */}
      <SectionCard title="Top Agents Performance" viewAllHref="/app/agents">
        <div className="px-5 py-4">
          <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 border-b border-border">
            <span className="col-span-2">Agent Name</span>
            <span className="text-center">Completed Cases</span>
            <span className="text-right">Success Rate</span>
          </div>
          <div className="space-y-4 pt-4">
            {topAgents.map((agent, index) => (
              <div key={`${agent.name}-${index}`} className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-2 flex items-center gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs font-bold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                      {agent.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-slate-900 truncate">{agent.name}</span>
                </div>
                <span className="text-sm text-slate-600 text-center font-medium">{agent.completed}</span>
                <div className="flex flex-col items-end gap-1.5 w-full">
                  <span className="text-xs font-bold text-slate-900">{agent.rate}%</span>
                  <Progress value={agent.rate} className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
