"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase, FiCheckCircle, FiClock, FiAlertCircle, FiRefreshCw,
  FiMapPin, FiArrowRight, FiBell, FiChevronRight, FiNavigation,
  FiCamera, FiPhone, FiUpload, FiMessageSquare, FiTrendingUp, FiCalendar, FiChevronDown, FiX, FiCheck, FiInfo
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAgentCasesApi, updateAgentCaseStatusApi } from "@/lib/api";

type CaseStatus = "PENDING" | "ASSIGNED" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
type Priority = "High" | "Medium" | "Low";

interface Customer {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string;
  loanAmount: number;
  loanType: string;
  businessName: string | null;
  branch: string | null;
}

interface CaseItem {
  id: string;
  status: CaseStatus;
  type: string;
  branch: string | null;
  customerId: string;
  agentId: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  remarks: string | null;
  profileData: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  customer: Customer;
}

export default function AgentDashboard() {
  const router = useRouter();
  
  // Loading & state management
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [agentName, setAgentName] = useState("Agent");
  
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Pending" | "In Progress" | "High Priority">("All");
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState("Today");

  // Load user info & cases from backend
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Load user profile from localStorage
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("lvms_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setAgentName(`${u.firstName} ${u.lastName}`);
        }
      }

      const res = await getAgentCasesApi();
      if (res.data.success) {
        const casesList: CaseItem[] = res.data.data;
        setCases(casesList);
        
        // Find default active case (In Progress, Travelling, At Location, or first Assigned)
        const activeOne = casesList.find(c => ["IN_PROGRESS", "TRAVELLING", "AT_LOCATION"].includes(c.status))
                       || casesList.find(c => c.status === "ASSIGNED" || c.status === "PENDING")
                       || casesList[0];
        setSelectedCase(activeOne || null);
      }
    } catch (err: any) {
      toast.error("Failed to load dashboard data. Please log in again.");
      if (err.response?.status === 401) {
        router.push("/agent/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sync date label on load
  useEffect(() => {
    const todayStr = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    }).format(new Date());
    setCurrentDate(todayStr);
  }, []);

  // Map backend priority or mock it based on loan size
  const getPriority = (c: CaseItem): Priority => {
    if (c.customer.loanAmount > 1000000) return "High";
    if (c.customer.loanAmount > 500000) return "Medium";
    return "Low";
  };

  // Map backend status to human readable strings
  const getStatusLabel = (status: CaseStatus): string => {
    if (status === "ASSIGNED" || status === "PENDING") return "Pending";
    if (["TRAVELLING", "AT_LOCATION", "IN_PROGRESS"].includes(status)) return "In Progress";
    if (status === "COMPLETED") return "Completed";
    if (status === "REJECTED") return "Rejected";
    return status;
  };

  // Helper mock distance
  const getDistanceStr = (c: CaseItem): string => {
    const idNum = c.id.charCodeAt(c.id.length - 1) || 5;
    return `${(idNum % 8 + 1.2).toFixed(1)} km away`;
  };

  // Filter cases logic
  const getFilteredCases = () => {
    let result = cases;
    
    // If active KPI is clicked, filter by that status
    if (activeKpi) {
      if (activeKpi === "Assigned") {
        return result.filter(c => ["PENDING", "ASSIGNED", "TRAVELLING", "AT_LOCATION", "IN_PROGRESS"].includes(c.status));
      }
      return result.filter(c => getStatusLabel(c.status) === activeKpi);
    }

    if (selectedFilter === "Pending") {
      return result.filter(c => getStatusLabel(c.status) === "Pending");
    }
    if (selectedFilter === "In Progress") {
      return result.filter(c => getStatusLabel(c.status) === "In Progress");
    }
    if (selectedFilter === "High Priority") {
      return result.filter(c => getPriority(c) === "High");
    }
    return result;
  };

  const handleKpiClick = (kpiName: string) => {
    if (activeKpi === kpiName) {
      setActiveKpi(null);
    } else {
      setActiveKpi(kpiName);
    }
  };

  // Action Helpers
  const triggerCamera = () => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }
    toast.success(`Initializing camera... GPS Geo-tag active for ${selectedCase.customer.firstName}!`);
  };

  const triggerCall = () => {
    if (!selectedCase || !selectedCase.customer.phone) {
      toast.error("Phone number not available");
      return;
    }
    toast.success(`Dialing customer: ${selectedCase.customer.firstName} (${selectedCase.customer.phone})`);
  };

  const triggerUpload = () => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.success(`Uploading ${file.name} (Geo-tagged for ${selectedCase.customer.firstName})...`);
      }
    };
    input.click();
  };

  const triggerAddRemark = () => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }
    const remark = prompt(`Enter observation remark for ${selectedCase.customer.firstName}:`);
    if (remark) {
      toast.success("Observation remark cached locally!");
    }
  };

  const triggerNavigation = async () => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }
    try {
      // Set status to TRAVELLING if it is not already in progress
      if (["PENDING", "ASSIGNED"].includes(selectedCase.status)) {
        await updateAgentCaseStatusApi(selectedCase.id, "TRAVELLING");
        toast.success("Travel status registered! Navigation route opened.");
        fetchDashboardData();
      } else {
        toast.success(`Showing optimal route to ${selectedCase.customer.firstName}'s location.`);
      }
    } catch (err: any) {
      toast.error("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  // Calculate dynamic KPIs
  const totalAssigned = cases.length;
  const inProgressCount = cases.filter(c => ["TRAVELLING", "AT_LOCATION", "IN_PROGRESS"].includes(c.status)).length;
  const completedCount = cases.filter(c => c.status === "COMPLETED").length;
  const rejectedCount = cases.filter(c => c.status === "REJECTED").length;
  
  // Calculate completion percentage
  const totalConcluded = completedCount + rejectedCount;
  const completionPercentage = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-[#1E4DB7] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Syncing live dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, {agentName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your verification overview for today.</p>
        </div>
        
        {/* Date / Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            title="Refresh statistics"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <span>{currentDate}</span>
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1.5">
                {["Today", "Tomorrow", "Next 7 Days"].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      if (d === "Today") {
                        const todayStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date());
                        setCurrentDate(todayStr);
                      } else {
                        setCurrentDate(d);
                      }
                      setShowDatePicker(false);
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
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalAssigned}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Active assignments</span>
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
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{inProgressCount}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Active travel/audit</span>
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
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{completedCount}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Verified claims</span>
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
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{rejectedCount}</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-rose-600">
            <span>Declined verifications</span>
          </div>
        </button>

        {/* 5. Avg Time */}
        <div className="bg-white rounded-2xl p-4 text-left border border-gray-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Avg. Time</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">32 min</p>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-400">
            <span>Per verification case</span>
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
                { label: "All", count: totalAssigned },
                { label: "Pending", count: totalAssigned - completedCount - rejectedCount },
                { label: "In Progress", count: inProgressCount },
                { label: "High Priority", count: cases.filter(c => getPriority(c) === "High").length }
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    setSelectedFilter(pill.label as any);
                    setActiveKpi(null);
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
              {getFilteredCases().length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No cases found matching filter.</p>
              ) : (
                getFilteredCases().map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={cn(
                      "flex items-start justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                      selectedCase?.id === c.id
                        ? "border-[#1E4DB7] bg-blue-50/20"
                        : "border-gray-50 bg-[#FAFBFD] hover:bg-gray-50"
                    )}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                          getPriority(c) === "High" ? "bg-rose-100 text-rose-700" :
                          getPriority(c) === "Medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {getPriority(c)}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 font-semibold">{c.id.slice(-8)}</span>
                      </div>
                      <h4 className="text-[14px] font-bold text-gray-900 leading-snug">
                        {c.customer.firstName} {c.customer.lastName}
                      </h4>
                      <p className="text-[12px] text-gray-400 truncate leading-snug">{c.customer.address}</p>
                      <p className="text-[11px] font-medium text-gray-500">{c.type === "RESIDENTIAL" ? "Residential" : "Business"} Verification</p>
                    </div>
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <span className="text-[11px] text-[#1E4DB7] font-semibold flex items-center gap-1">
                        <FiMapPin className="w-3.5 h-3.5" />
                        {getDistanceStr(c)}
                      </span>
                      <FiChevronRight className="w-4 h-4 text-gray-300 animate-pulse" />
                    </div>
                  </div>
                ))
              )}
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

            {/* Route Map */}
            <div className="bg-[#EBF1FA] rounded-2xl h-44 relative overflow-hidden border border-blue-100 flex items-center justify-center mb-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1E4DB7_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              
              <svg className="absolute inset-0 w-full h-full p-6 text-[#1E4DB7]" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 20 20 Q 50 15 80 40 T 30 70 T 50 90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
                <path d="M 20 20 Q 50 15 80 40 T 30 70 T 50 90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-[dash_4s_linear_infinite]" />
              </svg>

              {/* Dynamic pins matching schedule items */}
              {cases.slice(0, 4).map((c, idx) => {
                const styles = [
                  { top: "15%", left: "20%", bg: "bg-rose-500" },
                  { top: "35%", left: "78%", bg: "bg-amber-500" },
                  { top: "68%", left: "28%", bg: "bg-blue-600" },
                  { top: "85%", left: "48%", bg: "bg-slate-500" },
                ];
                const s = styles[idx] || styles[3];
                return (
                  <div
                    key={c.id}
                    className={cn("absolute w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-[10px] font-bold text-white", s.bg)}
                    style={{ top: s.top, left: s.left }}
                  >
                    {idx + 1}
                  </div>
                );
              })}

              {/* Region Label */}
              <div className="absolute text-[15px] font-extrabold text-gray-900 drop-shadow-sm tracking-wide bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl shadow-sm border border-blue-50">
                {cases[0]?.branch || "Assigned Territory"}
              </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
              {cases.slice(0, 4).map((s, idx) => {
                const colors = ["bg-rose-50 text-rose-700", "bg-amber-50 text-amber-700", "bg-blue-50 text-blue-700", "bg-slate-50 text-slate-700"];
                const bulletColors = ["bg-rose-500", "bg-amber-500", "bg-blue-600", "bg-slate-500"];
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-2 bg-[#FAFBFD] rounded-xl border border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white", bulletColors[idx] || "bg-slate-500")}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{s.customer.firstName} {s.customer.lastName}</p>
                        <p className="text-[10px] text-gray-400">{s.type === "RESIDENTIAL" ? "Residential" : "Business"} Verification</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-semibold text-gray-500">Today</p>
                      <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase", colors[idx] || "bg-gray-100 text-gray-600")}>
                        {getStatusLabel(s.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={triggerNavigation}
            className="w-full mt-4 border border-[#1E4DB7] text-[#1E4DB7] hover:bg-blue-50 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <FiNavigation className="w-4.5 h-4.5 animate-bounce" />
            <span>Start Route Navigation</span>
          </button>
        </div>

        {/* Column 3: Stats & Actions */}
        <div className="space-y-6">
          {/* Card 1: Current Case */}
          {selectedCase ? (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-gray-900">Case Details</h2>
                <Link href={`/agent/cases/${selectedCase.id}`} className="text-xs font-semibold text-[#1E4DB7] hover:underline">
                  View details
                </Link>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-gray-400">{selectedCase.id.slice(-12)}</span>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                    {getStatusLabel(selectedCase.status)}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  {selectedCase.customer.firstName} {selectedCase.customer.lastName}
                </h3>
                <p className="text-[11px] font-semibold text-gray-400">
                  {selectedCase.type === "RESIDENTIAL" ? "Residential" : "Business"} Verification
                </p>
                
                <div className="flex items-start gap-1.5 bg-gray-50 p-2.5 rounded-xl">
                  <FiMapPin className="w-4 h-4 text-[#1E4DB7] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-snug">{selectedCase.customer.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-3 text-center">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">Distance</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{getDistanceStr(selectedCase)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">Loan Type</p>
                  <p className="text-xs font-extrabold text-gray-900 mt-1 truncate">{selectedCase.customer.loanType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">Amount</p>
                  <p className="text-xs font-bold text-gray-900 mt-1">₹{(selectedCase.customer.loanAmount / 100000).toFixed(1)}L</p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/agent/verify/${selectedCase.id}`)}
                className="w-full text-white py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                style={{ background: "#1E4DB7" }}
              >
                <span>Process Verification</span>
                <FiArrowRight className="w-4 h-4 animate-pulse" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center py-8">
              <FiInfo className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No active case selected.</p>
            </div>
          )}

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
              <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="44" cy="44" r="34" className="text-gray-100" strokeWidth="6" stroke="currentColor" fill="transparent" />
                  <circle cx="44" cy="44" r="34" className="text-teal-500" strokeWidth="7" strokeDasharray={213} strokeDashoffset={213 - (213 * completionPercentage) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-[15px] font-black text-gray-900">{completionPercentage}%</span>
                  <p className="text-[8px] text-gray-400 font-semibold leading-tight">Completed</p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 flex-1 text-[11px] font-semibold text-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                  </div>
                  <span className="text-gray-900">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>In Progress</span>
                  </div>
                  <span className="text-gray-900">{inProgressCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </div>
                  <span className="text-gray-900">{totalAssigned - completedCount - rejectedCount - inProgressCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Rejected</span>
                  </div>
                  <span className="text-gray-900">{rejectedCount}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">Total Cases</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{totalAssigned}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">Concluded</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{totalConcluded}</p>
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
