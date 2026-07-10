"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiAlertCircle,
  FiMapPin, FiArrowRight, FiNavigation,
  FiCamera, FiPhone, FiUpload, FiMessageSquare, FiTrendingUp, FiCalendar, FiChevronDown, FiChevronRight
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAgentDashboardApi } from "@/lib/api";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type DashboardData = {
  agent: { name: string; branch: string; email: string };
  kpis: { total: number; pending: number; inProgress: number; completed: number; rejected: number };
  recentCases: {
    id: string; customer: string; address: string; type: string;
    status: string; priority: string; updatedOn: string;
  }[];
};

const PRIORITY_MAP: Record<string, "High" | "Medium" | "Low"> = {
  PENDING: "High", ASSIGNED: "High", IN_PROGRESS: "Medium",
  COMPLETED: "Low", REJECTED: "Low",
};

export default function AgentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Pending" | "In Progress" | "High Priority">("All");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [currentDate] = useState(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));

  useEffect(() => {
    getAgentDashboardApi()
      .then((res) => setData(res.data.data))
      .catch(() => {
        toast.error("Session expired. Please log in again.");
        router.push("/agent/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const getFilteredCases = () => {
    if (!data) return [];
    let result = data.recentCases;
    if (activeKpi === "Assigned") return result.filter((c) => c.status === "PENDING" || c.status === "ASSIGNED" || c.status === "IN_PROGRESS");
    if (activeKpi) return result.filter((c) => c.status.toUpperCase() === activeKpi.toUpperCase().replace(" ", "_"));
    if (selectedFilter === "Pending") return result.filter((c) => c.status === "PENDING" || c.status === "ASSIGNED");
    if (selectedFilter === "In Progress") return result.filter((c) => c.status === "IN_PROGRESS");
    if (selectedFilter === "High Priority") return result.filter((c) => c.priority === "High");
    return result;
  };

  // Quick Action Handlers
  const triggerCamera = () => toast.success("Initializing camera sensor... GPS Geo-tag active!");
  const triggerCall   = () => toast.success("Dialing customer...");
  const triggerUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) toast.success(`Uploading ${file.name} (Geo-tagged)...`);
    };
    input.click();
  };
  const triggerAddRemark  = () => { const r = prompt("Enter observation remark:"); if (r) toast.success("Remark added!"); };
  const triggerNavigation = () => toast.success("Starting navigation...");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#1E4DB7]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const agentName = data?.agent?.name ?? "Agent";
  const filteredCases = getFilteredCases();

  return (
    <div className="space-y-6 pb-12 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, {agentName.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your verification overview for today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { key: "Assigned", label: "Assigned Cases",  value: kpis?.pending ?? 0,    icon: FiBriefcase,    color: "blue",    trend: "Active" },
          { key: "In Progress", label: "In Progress",  value: kpis?.inProgress ?? 0, icon: FiClock,        color: "amber",   trend: "Ongoing" },
          { key: "Completed", label: "Completed",      value: kpis?.completed ?? 0,  icon: FiCheckCircle,  color: "emerald", trend: "Done" },
          { key: "Rejected", label: "Rejected",        value: kpis?.rejected ?? 0,   icon: FiAlertCircle,  color: "rose",    trend: "Flagged" },
        ].map(({ key, label, value, icon: Icon, color, trend }) => (
          <button
            key={key}
            onClick={() => setActiveKpi(activeKpi === key ? null : key)}
            className={cn(
              "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
              activeKpi === key ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
            )}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-600 mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
            <p className={`text-xs font-medium text-${color}-600 mt-2`}>{trend}</p>
          </button>
        ))}
        {/* Avg Time — static metric */}
        <div className="bg-white rounded-2xl p-4 text-left border border-gray-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Total Cases</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{kpis?.total ?? 0}</p>
          <p className="text-xs font-medium text-gray-400 mt-2">All time</p>
        </div>
      </div>

      {/* ── 3-Column Dashboard Body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Assigned Cases */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Assigned Cases</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">View all</Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2">
              {[
                { label: "All",          count: data?.recentCases.length ?? 0 },
                { label: "Pending",      count: kpis?.pending ?? 0 },
                { label: "In Progress",  count: kpis?.inProgress ?? 0 },
                { label: "High Priority",count: data?.recentCases.filter((c) => c.priority === "High").length ?? 0 },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => { setSelectedFilter(pill.label as any); setActiveKpi(null); }}
                  className={cn(
                    "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                    selectedFilter === pill.label && !activeKpi
                      ? "text-white border-[#1E4DB7]"
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  )}
                  style={selectedFilter === pill.label && !activeKpi ? { background: "#1E4DB7" } : {}}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>

            {/* Case List */}
            <div className="space-y-4">
              {filteredCases.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No cases found</div>
              ) : filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/agent/cases/${c.id}`)}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-gray-50 bg-[#FAFBFD] hover:bg-gray-50 cursor-pointer transition-all"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                        c.priority === "High" ? "bg-rose-100 text-rose-700" :
                        c.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {c.priority}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 font-semibold truncate">{c.id.slice(0, 16)}...</span>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900 leading-snug">{c.customer}</h4>
                    <p className="text-[12px] text-gray-400 truncate leading-snug">{c.address}</p>
                    <p className="text-[11px] font-medium text-gray-500">{c.type}</p>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 mt-4 text-center">
            <Link href="/agent/cases" className="text-xs font-bold text-[#1E4DB7] hover:underline flex items-center justify-center gap-1.5">
              <span>View all assigned cases</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Column 2: Today's Route */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Today's Schedule</h2>
              <button onClick={triggerNavigation} className="text-xs font-semibold text-[#1E4DB7] hover:underline">View route</button>
            </div>

            {/* Route Map Visual */}
            <div className="bg-[#EBF1FA] rounded-2xl h-44 relative overflow-hidden border border-blue-100 flex items-center justify-center mb-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1E4DB7_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              <svg className="absolute inset-0 w-full h-full p-6 text-[#1E4DB7]" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 20 Q 50 15 80 40 T 30 70 T 50 90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
              </svg>
              {[1,2,3,4].map((n, i) => {
                const positions = ["top-[15%] left-[20%]","top-[35%] left-[78%]","top-[68%] left-[28%]","top-[85%] left-[48%]"];
                const colors = ["bg-rose-500","bg-amber-500","bg-blue-600","bg-slate-500"];
                return (
                  <div key={n} className={`absolute ${positions[i]} w-6 h-6 rounded-full ${colors[i]} border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white`}>{n}</div>
                );
              })}
              <div className="absolute text-[16px] font-extrabold text-gray-900 drop-shadow-sm tracking-wide">{data?.agent.branch ?? "Your Area"}</div>
            </div>

            {/* Schedule from real cases */}
            <div className="space-y-3">
              {(data?.recentCases.slice(0, 4) ?? []).map((c, i) => {
                const colors = ["bg-rose-500","bg-amber-500","bg-blue-600","bg-slate-500"];
                const statusColor = c.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2 bg-[#FAFBFD] rounded-xl border border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${colors[i]}`}>{i+1}</div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.customer}</p>
                        <p className="text-[10px] text-gray-400">{c.type}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${statusColor}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={triggerNavigation}
            className="w-full mt-4 border border-[#1E4DB7] text-[#1E4DB7] hover:bg-blue-50 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <FiNavigation className="w-4 h-4" />
            <span>Start Navigation</span>
          </button>
        </div>

        {/* Column 3: Stats & Quick Actions */}
        <div className="space-y-6">
          {/* Current Case */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">Current Case</h2>
              {data?.recentCases[0] && (
                <Link href={`/agent/cases/${data.recentCases[0].id}`} className="text-xs font-semibold text-[#1E4DB7] hover:underline">View details</Link>
              )}
            </div>
            
            {data?.recentCases[0] ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-gray-400 truncate">{data.recentCases[0].id.slice(0,18)}...</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 ml-1">{data.recentCases[0].status.replace("_"," ")}</span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">{data.recentCases[0].customer}</h3>
                <p className="text-[11px] font-semibold text-gray-400">{data.recentCases[0].type}</p>
                <div className="flex items-start gap-1.5 bg-gray-50 p-2.5 rounded-xl">
                  <FiMapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-snug">{data.recentCases[0].address}</p>
                </div>
                <button
                  onClick={() => router.push(`/agent/verify/${data.recentCases[0].id}`)}
                  className="w-full text-white py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ background: "#1E4DB7" }}
                >
                  <span>Continue Verification</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No active cases assigned</p>
            )}
          </div>

          {/* Verification Progress */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">Verification Progress</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">View all</Link>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                  <circle cx="48" cy="48" r="38" className="text-teal-500" strokeWidth="7"
                    strokeDasharray={238}
                    strokeDashoffset={238 - (238 * ((kpis?.total ?? 0) === 0 ? 0 : Math.round(((kpis?.completed ?? 0) / (kpis?.total ?? 1)) * 100))) / 100}
                    strokeLinecap="round" stroke="currentColor" fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-[16px] font-black text-gray-900">
                    {(kpis?.total ?? 0) === 0 ? "0%" : `${Math.round(((kpis?.completed ?? 0) / (kpis?.total ?? 1)) * 100)}%`}
                  </span>
                  <p className="text-[9px] text-gray-400 font-semibold leading-tight">Done</p>
                </div>
              </div>
              <div className="space-y-1.5 flex-1 text-xs font-semibold text-gray-600">
                {[
                  { label: "Completed", value: kpis?.completed, color: "bg-emerald-500" },
                  { label: "In Progress", value: kpis?.inProgress, color: "bg-blue-600" },
                  { label: "Pending", value: kpis?.pending, color: "bg-amber-500" },
                  { label: "Rejected", value: kpis?.rejected, color: "bg-rose-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span>{label}</span>
                    </div>
                    <span className="text-gray-900">{value ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: FiCamera, label: "Capture Photo", fn: triggerCamera },
                { icon: FiMessageSquare, label: "Add Remark", fn: triggerAddRemark },
                { icon: FiPhone, label: "Call Customer", fn: triggerCall },
                { icon: FiUpload, label: "Upload Document", fn: triggerUpload },
              ].map(({ icon: Icon, label, fn }) => (
                <button key={label} onClick={fn}
                  className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
