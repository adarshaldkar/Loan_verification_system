"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  FiUsers, FiBriefcase, FiClock, FiCheckCircle,
  FiUserCheck, FiGitBranch, FiFile, FiUploadCloud, FiUserPlus, FiCalendar, FiChevronDown,
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

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

const kpiData = [
  { label: "Total Customers", value: 12534, icon: <FiUsers />, iconBg: "bg-blue-50",   trend: 15.3 },
  { label: "Total Cases",     value: 10820, icon: <FiBriefcase />, iconBg: "bg-purple-50", trend: 12.1 },
  { label: "Pending Cases",   value: 4562,  icon: <FiClock />,     iconBg: "bg-amber-50",  trend: 8.5 },
  { label: "Completed Cases", value: 5860,  icon: <FiCheckCircle />, iconBg: "bg-teal-50", trend: 18.7 },
  { label: "Active Agents",   value: 245,   icon: <FiUserCheck />, iconBg: "bg-indigo-50", trend: 9.4 },
  { label: "Branches",        value: 28,    icon: <FiGitBranch />, iconBg: "bg-slate-100", trend: 0 },
];

const lineData = [
  { date: "12 May", total: 980,  completed: 620, pending: 280, rejected: 80  },
  { date: "13 May", total: 1120, completed: 700, pending: 310, rejected: 110 },
  { date: "14 May", total: 1050, completed: 650, pending: 290, rejected: 110 },
  { date: "15 May", total: 2100, completed: 1350, pending: 580, rejected: 170 },
  { date: "16 May", total: 1750, completed: 1050, pending: 500, rejected: 200 },
  { date: "17 May", total: 1900, completed: 1200, pending: 520, rejected: 180 },
  { date: "18 May", total: 2050, completed: 1300, pending: 540, rejected: 210 },
];

const pieData = [
  { name: "Pending",     value: 4562, color: "#B45309" },
  { name: "In Progress", value: 2450, color: "#1D4ED8" },
  { name: "Completed",   value: 5860, color: "#0D9488" },
  { name: "Rejected",    value: 548,  color: "#BE123C"  },
];

const recentCases: {
  id: string;
  customer: string;
  type: "Residential" | "Business";
  status: VerificationStatus;
  agent: string;
  updatedOn: string;
}[] = [
  { id: "LV-2026-10820", customer: "Amit Kumar",    type: "Residential", status: "Pending",     agent: "Not Assigned",  updatedOn: "18 May, 10:30 AM" },
  { id: "LV-2026-10819", customer: "Priya Sharma",  type: "Business",    status: "In Progress",  agent: "Ramesh Singh",  updatedOn: "18 May, 09:45 AM" },
  { id: "LV-2026-10818", customer: "Sandeep Yadav", type: "Residential", status: "Completed",    agent: "Amit Kumar",    updatedOn: "18 May, 09:20 AM" },
  { id: "LV-2026-10817", customer: "Neha Verma",    type: "Business",    status: "Rejected",     agent: "Vikash Patel",  updatedOn: "17 May, 06:15 PM" },
  { id: "LV-2026-10816", customer: "Rahul Gupta",   type: "Residential", status: "Pending",     agent: "Not Assigned",  updatedOn: "17 May, 04:40 PM" },
  { id: "LV-2026-10815", customer: "Kavita Singh",  type: "Business",    status: "Completed",    agent: "Suresh Yadav",  updatedOn: "17 May, 02:10 PM" },
  { id: "LV-2026-10814", customer: "Arvind Patel",  type: "Residential", status: "In Progress",  agent: "Manoj Tiwari",  updatedOn: "16 May, 11:55 AM" },
  { id: "LV-2026-10813", customer: "Sunita Joshi",  type: "Business",    status: "Pending",     agent: "Not Assigned",  updatedOn: "16 May, 09:00 AM" },
];

const topAgents = [
  { name: "Amit Kumar",    completed: 128, inProgress: 24, rate: 95 },
  { name: "Ramesh Singh",  completed: 112, inProgress: 18, rate: 93 },
  { name: "Vikash Patel",  completed: 98,  inProgress: 21, rate: 90 },
  { name: "Suresh Yadav",  completed: 87,  inProgress: 16, rate: 89 },
  { name: "Manoj Tiwari",  completed: 76,  inProgress: 14, rate: 88 },
];

const recentActivity = [
  {
    icon: <FiCheckCircle className="w-4 h-4" style={{ color: "#0D9488" }} />,
    bg: "bg-teal-50",
    title: "Verification completed",
    desc: "Case #LV-2026-10820 completed",
    time: "10 min ago",
  },
  {
    icon: <FiBriefcase className="w-4 h-4" style={{ color: "#1D4ED8" }} />,
    bg: "bg-blue-50",
    title: "New case assigned",
    desc: "Case #LV-2026-10821 assigned to Agent Amit Kumar",
    time: "25 min ago",
  },
  {
    icon: <FiUploadCloud className="w-4 h-4" style={{ color: "#1E3A5F" }} />,
    bg: "bg-blue-50",
    title: "Excel file uploaded",
    desc: "File customers_may_18.xlsx uploaded successfully",
    time: "1 hr ago",
  },
  {
    icon: <FiUserPlus className="w-4 h-4 text-amber-700" />,
    bg: "bg-amber-50",
    title: "New agent registered",
    desc: "Agent Suresh Yadav registered successfully",
    time: "2 hr ago",
  },
];

const CHART_PERIOD_OPTIONS = ["This Week", "Last Week", "This Month"];

/* ─── Custom Tooltip for line chart ─────────────────────────────────────── */

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back, Rohit! Here's what's happening today."
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
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
            <LineChart data={lineData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
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
                  10,820
                </p>
                <p className="text-[11px] text-slate-400">Total</p>
              </div>
            </div>
            {/* Legend rows */}
            <div className="mt-3 space-y-1.5">
              {pieData.map(({ name, value, color }) => {
                const pct = ((value / 10820) * 100).toFixed(1);
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

      {/* ── Bottom Row: Recent Cases + Right Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        {/* Recent Cases — fills available height */}
        <div className="lg:col-span-3 flex flex-col">
          <SectionCard title="Recent Cases" viewAllHref="/app/cases">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Case ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden xl:table-cell">Updated On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                          <FiFile className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          {c.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{c.customer}</td>
                      <td className="px-4 py-3.5 text-slate-500 hidden md:table-cell">{c.type}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell">{c.agent}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs hidden xl:table-cell whitespace-nowrap">{c.updatedOn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Recent Activity */}
          <SectionCard title="Recent Activity">
            <div className="divide-y divide-border">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base", item.bg)}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-tight">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.desc}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">{item.time}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <Link
                href="/app/audit-logs"
                className="text-xs font-medium text-[#1E3A5F] hover:underline flex items-center gap-1"
              >
                View All Activity
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </SectionCard>

          {/* Top Agents */}
          <SectionCard title="Top Agents Performance" viewAllHref="/app/agents">
            <div className="px-5 py-3">
              <div className="grid grid-cols-4 text-[11px] font-medium text-slate-400 uppercase tracking-wider pb-2 border-b border-border">
                <span className="col-span-2">Agent Name</span>
                <span className="text-center">Completed</span>
                <span className="text-right">Rate</span>
              </div>
              <div className="space-y-3 pt-3">
                {topAgents.map((agent) => (
                  <div key={agent.name} className="grid grid-cols-4 items-center gap-2">
                    <div className="col-span-2 flex items-center gap-2">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                          {agent.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-slate-900 truncate">{agent.name}</span>
                    </div>
                    <span className="text-xs text-slate-600 text-center">{agent.completed}</span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold text-slate-900">{agent.rate}%</span>
                      <Progress value={agent.rate} className="h-1.5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
