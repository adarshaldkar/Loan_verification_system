"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw,
  FiMapPin, FiArrowRight, FiBell, FiChevronRight, FiNavigation,
  FiCamera, FiPhone, FiUpload, FiMessageSquare, FiTrendingUp, FiCalendar, FiChevronDown, FiX, FiCheck
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

type CaseStatus = "Pending" | "In Progress" | "Completed" | "Rejected";
type Priority = "High" | "Medium" | "Low";

interface CaseItem {
  id: string;
  customer: string;
  type: string;
  address: string;
  priority: Priority;
  distance: string;
  status: CaseStatus;
  time?: string;
  order: number;
}

const initialCases: CaseItem[] = [
  { order: 1, id: "CASE-2026-0891", customer: "Ramesh Kumar", type: "Residential Verification", address: "123, 4th Cross Street, Anna Nagar, Trichy - 620018", priority: "High", distance: "2.3 km away", status: "Pending", time: "10:30 AM" },
  { order: 2, id: "CASE-2026-0892", customer: "Lakshmi Devi", type: "Business Verification", address: "56, Bharathi Nagar, Woraiyur, Trichy - 620003", priority: "Medium", distance: "5.6 km away", status: "Pending", time: "12:00 PM" },
  { order: 3, id: "CASE-2026-0893", customer: "Vijay Enterprises", type: "Business Verification", address: "18, Lawspet Road, Lawspet, Pondicherry - 605008", priority: "Medium", distance: "8.1 km away", status: "In Progress", time: "02:30 PM" },
  { order: 4, id: "CASE-2026-0894", customer: "Suresh Babu", type: "Residential Verification", address: "9, East Street, Srirangam, Trichy - 620006", priority: "Low", distance: "12.4 km away", status: "Pending", time: "04:30 PM" },
  { order: 5, id: "CASE-2026-0895", customer: "Karthik Traders", type: "Business Verification", address: "77, Main Road, Thanjavur - 613001", priority: "Low", distance: "18.7 km away", status: "Pending", time: "05:00 PM" },
  { order: 6, id: "CASE-2026-0888", customer: "Anjali Rao", type: "Residential Verification", address: "14, Vasanth Nagar, Bangalore", priority: "High", distance: "4.2 km away", status: "Completed", time: "09:00 AM" },
  { order: 7, id: "CASE-2026-0889", customer: "Vikram Malhotra", type: "Business Verification", address: "404, Prestige Towers, Bangalore", priority: "Medium", distance: "6.0 km away", status: "Completed", time: "10:00 AM" },
  { order: 8, id: "CASE-2026-0890", customer: "Sunil Dutt", type: "Residential Verification", address: "12, Outer Ring Road, Bangalore", priority: "Low", distance: "11.1 km away", status: "Rejected", time: "11:30 AM" }
];

export default function AgentDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Pending" | "In Progress" | "High Priority">("All");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState("May 27, 2026");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [liveCases, setLiveCases] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { getAgentDashboardApi, getAgentCasesApi } = await import("@/lib/api");
        const [dashRes, casesRes] = await Promise.all([
          getAgentDashboardApi(),
          getAgentCasesApi(),
        ]);
        setDashboardData(dashRes.data.data);
        setLiveCases(casesRes.data.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Agent Profile Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* KPIs Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-3 border border-gray-50 rounded-xl space-y-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Cases Section Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full ml-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter cases logic
  const getFilteredCases = () => {
    let result = cases;
    
    // If active KPI is clicked, filter by that status
    if (activeKpi) {
      if (activeKpi === "Assigned") {
        return result.filter(c => c.status === "Pending" || c.status === "In Progress");
      }
      return result.filter(c => c.status === activeKpi);
    }

    if (selectedFilter === "Pending") {
      return result.filter(c => c.status === "Pending");
    }
    if (selectedFilter === "In Progress") {
      return result.filter(c => c.status === "In Progress");
    }
    if (selectedFilter === "High Priority") {
      return result.filter(c => c.priority === "High");
    }
    return result.slice(0, 5); // Default display of 5 cases
  };

  const handleKpiClick = (kpiName: string) => {
    if (activeKpi === kpiName) {
      setActiveKpi(null); // toggle off
    } else {
      setActiveKpi(kpiName);
    }
  };

  // Quick Action Handlers
  const triggerCamera = () => {
    toast.success("Opening Camera (GPS Geo-tag active)...");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.onchange = () => {
      toast.success("Photo captured and stored with GPS geo-tags!");
    };
    input.click();
  };

  const triggerCall = () => {
    toast.success("Opening dialer: Vijay Enterprises (+91 98765 43210)");
    window.location.href = "tel:+919876543210";
  };

  const triggerUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.success(`Uploading ${file.name} (Geo-tagged)...`);
      }
    };
    input.click();
  };

  const triggerAddRemark = () => {
    const remark = prompt("Enter observation remark for Vijay Enterprises:");
    if (remark) {
      toast.success("Observation remark added successfully!");
    }
  };

  const triggerNavigation = () => {
    toast.success("Starting navigation: Opening Google Maps...");
    window.open("https://www.google.com/maps/dir/?api=1&destination=18,+Lawspet+Road,+Lawspet,+Pondicherry+-+605008", "_blank");
  };

  return (
    <div className="space-y-6 pb-12 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, Arun Kumar! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your verification overview for today.</p>
        </div>
        
        {/* Date Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>{currentDate}</span>
            <FiChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1.5">
              {["May 27, 2026", "May 28, 2026", "May 29, 2026"].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setCurrentDate(d);
                    setShowDatePicker(false);
                    toast.success(`Date changed to ${d}`);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                    currentDate === d ? "text-[#1E4DB7] font-semibold" : "text-gray-600"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Assigned Cases */}
        <button
          onClick={() => handleKpiClick("Assigned")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "Assigned" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-3">
            <FiBriefcase className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Assigned Cases</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">8</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>2 new today</span>
          </div>
        </button>

        {/* 2. In Progress */}
        <button
          onClick={() => handleKpiClick("In Progress")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "In Progress" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">In Progress</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">2</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Continue pending</span>
          </div>
        </button>

        {/* 3. Completed */}
        <button
          onClick={() => handleKpiClick("Completed")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "Completed" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 mb-3">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Completed</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">5</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>2 today</span>
          </div>
        </button>

        {/* 4. Rejected */}
        <button
          onClick={() => handleKpiClick("Rejected")}
          className={cn(
            "bg-white rounded-2xl p-4 text-left border transition-all shadow-sm hover:shadow-md",
            activeKpi === "Rejected" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]" : "border-gray-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 mb-3">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Rejected</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">1</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-rose-600 hover:underline">
            <span>View details</span>
          </div>
        </button>

        {/* 5. Avg Time */}
        <div className="bg-white rounded-2xl p-4 text-left border border-gray-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Avg. Time</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">42 min</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-400">
            <span>Per verification</span>
          </div>
        </div>
      </div>

      {/* ── 3-Column Dashboard Body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Assigned Cases */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Assigned Cases</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View all
              </Link>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2">
              {[
                { label: "All", count: 8 },
                { label: "Pending", count: 5 },
                { label: "In Progress", count: 2 },
                { label: "High Priority", count: 2 }
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    setSelectedFilter(pill.label as any);
                    setActiveKpi(null); // clear KPI filter when switching pills
                  }}
                  className={cn(
                    "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                    selectedFilter === pill.label && !activeKpi
                      ? "text-white"
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  )}
                  style={selectedFilter === pill.label && !activeKpi ? { background: "#1E4DB7", borderColor: "#1E4DB7" } : {}}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>

            {/* Case List */}
            <div className="space-y-4">
              {getFilteredCases().map((c) => (
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
                      <span className="text-[11px] font-mono text-gray-400 font-semibold">{c.id}</span>
                    </div>
                    <h4 className="text-[14px] font-bold text-gray-900 leading-snug">{c.customer}</h4>
                    <p className="text-[12px] text-gray-400 truncate leading-snug">{c.address}</p>
                    <p className="text-[11px] font-medium text-gray-500">{c.type}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <span className="text-[11px] text-[#1E4DB7] font-semibold flex items-center gap-1">
                      <FiMapPin className="w-3.5 h-3.5" />
                      {c.distance}
                    </span>
                    <FiChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
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

        {/* Column 2: Today's Schedule */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Today's Schedule</h2>
              <button onClick={triggerNavigation} className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View route
              </button>
            </div>

            {/* Route Map (SVG route vector matching design) */}
            <div className="bg-[#EBF1FA] rounded-2xl h-44 relative overflow-hidden border border-blue-100 flex items-center justify-center mb-4">
              {/* Map background grid simulation */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1E4DB7_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              
              {/* Map path SVG matching Trichy routing view */}
              <svg className="absolute inset-0 w-full h-full p-6 text-[#1E4DB7]" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 20 Q 50 15 80 40 T 30 70 T 50 90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
                <path d="M 20 20 Q 50 15 80 40 T 30 70 T 50 90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-[dash_4s_linear_infinite]" />
              </svg>

              {/* Pins matching schedule items */}
              <div className="absolute top-[15%] left-[20%] w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">1</div>
              <div className="absolute top-[35%] left-[78%] w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">2</div>
              <div className="absolute top-[68%] left-[28%] w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">3</div>
              <div className="absolute top-[85%] left-[48%] w-6 h-6 rounded-full bg-slate-500 border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white">4</div>

              {/* Labels */}
              <span className="absolute top-[16%] left-[30%] text-[10px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm">Anna Nagar</span>
              <span className="absolute top-[38%] left-[55%] text-[10px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm">Woraiyur</span>
              <span className="absolute top-[65%] left-[40%] text-[10px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm">Lawspet</span>
              <span className="absolute top-[82%] left-[58%] text-[10px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm">Srirangam</span>

              {/* Map Title center */}
              <div className="absolute text-[16px] font-extrabold text-gray-900 drop-shadow-sm tracking-wide">
                Tiruchirappalli
              </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
              {[
                { num: 1, name: "Ramesh Kumar", type: "Residential Verification", time: "10:30 AM", status: "Pending", bg: "bg-amber-50 text-amber-700" },
                { num: 2, name: "Lakshmi Devi", type: "Business Verification", time: "12:00 PM", status: "Pending", bg: "bg-amber-50 text-amber-700" },
                { num: 3, name: "Vijay Enterprises", type: "Business Verification", time: "02:30 PM", status: "In Progress", bg: "bg-blue-50 text-blue-700" },
                { num: 4, name: "Suresh Babu", type: "Residential Verification", time: "04:30 PM", status: "Pending", bg: "bg-amber-50 text-amber-700" }
              ].map((s) => (
                <div key={s.num} className="flex items-center justify-between gap-2 p-2 bg-[#FAFBFD] rounded-xl border border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                      s.num === 1 ? "bg-rose-500" :
                      s.num === 2 ? "bg-amber-500" :
                      s.num === 3 ? "bg-blue-600" : "bg-slate-500"
                    )}>{s.num}</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-semibold text-gray-500">{s.time}</p>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5", s.bg)}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={triggerNavigation}
            className="w-full mt-4 border border-[#1E4DB7] text-[#1E4DB7] hover:bg-blue-50 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <FiNavigation className="w-4.5 h-4.5" />
            <span>Start Navigation</span>
          </button>
        </div>

        {/* Column 3: Stats & Actions */}
        <div className="space-y-6">
          {/* Card 1: Current Case */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">Current Case</h2>
              {liveCases[0] && (
                <Link href={`/agent/cases/${liveCases[0].id}`} className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                  View details
                </Link>
              )}
            </div>
            
            {liveCases[0] ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-gray-400">{liveCases[0].id}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{liveCases[0].status}</span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">{liveCases[0].customer}</h3>
                <p className="text-[11px] font-semibold text-gray-400">{liveCases[0].type === 'BUSINESS' ? 'Business' : 'Residential'} Verification</p>
                
                <div className="flex items-start gap-1.5 bg-gray-50 p-2.5 rounded-xl">
                  <FiMapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-snug">{liveCases[0].address}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">No active cases assigned</p>
              </div>
            )}

            <button
              onClick={() => liveCases[0] && router.push(`/agent/verify/${liveCases[0].id}`)}
              className="w-full text-white py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ background: "#1E4DB7" }}
            >
              <span>Continue Verification</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Verification Progress */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900">Verification Progress</h2>
              <Link href="/agent/cases" className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                View all
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {/* Radial Progress Chart SVG */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                  <circle cx="48" cy="48" r="38" className="text-teal-500" strokeWidth="7" strokeDasharray={238} strokeDashoffset={238 - (238 * 75) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-[16px] font-black text-gray-900">75%</span>
                  <p className="text-[9px] text-gray-400 font-semibold leading-tight">Completed</p>
                </div>
              </div>

              {/* Legend matching reference image */}
              <div className="space-y-1.5 flex-1 text-xs font-semibold text-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                  </div>
                  <span className="text-gray-900">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>In Progress</span>
                  </div>
                  <span className="text-gray-900">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </div>
                  <span className="text-gray-900">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Rejected</span>
                  </div>
                  <span className="text-gray-900">1</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">Total Cases</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">13</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">This Month</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">13</p>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-gray-900">Quick Actions</h2>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={triggerCamera}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiCamera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Capture Photo</p>
                </div>
              </button>

              <button
                onClick={triggerAddRemark}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiMessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Add Remark</p>
                </div>
              </button>

              <button
                onClick={triggerCall}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiPhone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Call Customer</p>
                </div>
              </button>

              <button
                onClick={triggerUpload}
                className="flex items-center gap-2 px-3 py-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-left group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E4DB7] shrink-0">
                  <FiUpload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">Upload Document</p>
                </div>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
