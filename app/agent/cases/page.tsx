"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiFilter, FiMapPin, FiNavigation, FiChevronRight, FiRefreshCw,
  FiPhone, FiArrowRight, FiCheckCircle, FiClock, FiAlertCircle, FiBriefcase,
  FiGrid, FiList, FiCopy, FiX, FiDollarSign, FiUser
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentCasesApi } from "@/lib/api";
import { toast } from "sonner";
import { getProfileByCode, VERIFICATION_PROFILES } from "@/lib/verificationProfiles";
import { STATUS_COLORS } from "@/lib/constants";
import { useDebounce } from "@/lib/hooks/useDebounce";
import PaginationControls from "@/components/shared/PaginationControls";

type CaseStatus = "ASSIGNED" | "PENDING" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "RE_VERIFICATION" | "REJECTED" | "APPROVED";
type CaseType   = string;

type AgentCase = {
  id: string;
  applicationId?: string;
  customer: string;
  phone: string;
  type: CaseType;
  address: string;
  priority: "High" | "Medium" | "Low";
  status: CaseStatus;
  assignedOn: string;
  loanType: string;
  loanAmount: number;
  branch: string;
  mediaCount: number;
  needsRevision: boolean;
};

const STATUS_FILTERS = [
  { id: "All", label: "All Cases" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REJECTED", label: "Rejected" },
] as const;

function getPriority(status: CaseStatus, needsRevision?: boolean): "High" | "Medium" | "Low" {
  if (needsRevision || status === "PENDING" || status === "ASSIGNED") return "High";
  if (status === "IN_PROGRESS" || status === "RE_VERIFICATION" || status === "TRAVELLING") return "Medium";
  return "Low";
}

/* ─── Assigned Cases Page ────────────────────────────────────────────────── */
export default function AssignedCasesPage() {
  const router = useRouter();
  const [search, setSearch]           = useState("");
  const debouncedSearch               = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [profileFilter, setProfileFilter] = useState<string>("All");
  const [sortBy, setSortBy]           = useState<"newest" | "priority" | "name" | "amount">("newest");
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [cases, setCases]             = useState<AgentCase[]>([]);
  const [error, setError]             = useState<string | null>(null);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, profileFilter, sortBy]);

  async function fetchCases(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getAgentCasesApi();
      const fetched: AgentCase[] = (res.data.data || []).map((c: any) => ({
        id: c.id,
        applicationId: c.applicationId || `APP-${c.id.slice(0, 8).toUpperCase()}`,
        customer: c.customer || "Unknown Customer",
        phone: c.phone || "",
        type: (c.type || "RESIDENTIAL") as CaseType,
        address: c.address || "No address provided",
        priority: getPriority(c.status, c.needsRevision),
        status: (c.status || "ASSIGNED") as CaseStatus,
        assignedOn: c.assignedOn || "Recently",
        loanType: c.loanType || "Personal/Home Loan",
        loanAmount: Number(c.loanAmount) || 0,
        branch: c.branch && c.branch !== "Unassigned" ? c.branch : "Chennai Hub",
        mediaCount: c.mediaCount || 0,
        needsRevision: Boolean(c.needsRevision),
      }));
      setCases(fetched);
      if (isManual) toast.success("Assigned cases refreshed");
    } catch (err: any) {
      console.error("Failed to load cases:", err);
      const msg = err?.response?.data?.message || "Failed to load assigned cases";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCases();
  }, []);

  // Filtered & Sorted Cases
  const filteredCases = useMemo(() => {
    let result = cases.filter((c) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.customer.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.applicationId && c.applicationId.toLowerCase().includes(q)) ||
        c.address.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.branch.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "ASSIGNED" && (c.status === "ASSIGNED" || c.status === "PENDING")) ||
        (statusFilter === "COMPLETED" && (c.status === "COMPLETED" || c.status === "APPROVED")) ||
        c.status === statusFilter;

      const matchProfile = profileFilter === "All" || c.type === profileFilter;

      return matchSearch && matchStatus && matchProfile;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "priority") {
        const pOrder = { High: 3, Medium: 2, Low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      if (sortBy === "name") {
        return a.customer.localeCompare(b.customer);
      }
      if (sortBy === "amount") {
        return b.loanAmount - a.loanAmount;
      }
      return 0;
    });

    return result;
  }, [cases, debouncedSearch, statusFilter, profileFilter, sortBy]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage, itemsPerPage]);

  // Quick stats computed live
  const stats = useMemo(() => {
    const total = cases.length;
    const pending = cases.filter(c => c.status === "ASSIGNED" || c.status === "PENDING").length;
    const inProgress = cases.filter(c => c.status === "IN_PROGRESS" || c.status === "TRAVELLING" || c.status === "AT_LOCATION").length;
    const completed = cases.filter(c => c.status === "COMPLETED" || c.status === "APPROVED").length;
    return { total, pending, inProgress, completed };
  }, [cases]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>

        {/* Search & Filter Skeleton */}
        <div className="flex flex-col md:flex-row gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>

        {/* Cases Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 p-8">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Unable to load verification cases</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchCases(true)}
          className="flex items-center gap-2 text-xs font-bold text-white px-5 py-2.5 rounded-xl bg-[#1E4DB7] hover:bg-blue-800 transition-all shadow-md"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── 1. Page Header & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            Assigned Field Cases 📋
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Manage, navigate, and execute on-site customer verifications ({filteredCases.length} of {cases.length} cases showing)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                viewMode === "grid" ? "bg-[#1E4DB7] text-white shadow-sm" : "text-gray-500 hover:text-gray-800 dark:text-slate-400"
              )}
              title="Grid View"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                viewMode === "list" ? "bg-[#1E4DB7] text-white shadow-sm" : "text-gray-500 hover:text-gray-800 dark:text-slate-400"
              )}
              title="List View"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchCases(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
          >
            <FiRefreshCw className={cn("w-3.5 h-3.5 text-[#1E4DB7]", refreshing && "animate-spin")} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Live KPI Summary Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter("All")}
          className={cn(
            "bg-white dark:bg-slate-950 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            statusFilter === "All" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-blue-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Total Cases</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
              <FiBriefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">{stats.total}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Assigned to your queue</p>
        </div>

        <div
          onClick={() => setStatusFilter("ASSIGNED")}
          className={cn(
            "bg-white dark:bg-slate-950 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            statusFilter === "ASSIGNED" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-rose-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Pending Visits</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <FiClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{stats.pending}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Awaiting agent visit</p>
        </div>

        <div
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={cn(
            "bg-white dark:bg-slate-950 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            statusFilter === "IN_PROGRESS" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-amber-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats.inProgress}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Under live verification</p>
        </div>

        <div
          onClick={() => setStatusFilter("COMPLETED")}
          className={cn(
            "bg-white dark:bg-slate-950 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md",
            statusFilter === "COMPLETED" ? "border-[#1E4DB7] ring-1 ring-[#1E4DB7]/40 bg-emerald-50/20" : "border-gray-100 dark:border-slate-800"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.completed}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Evidence submitted & verified</p>
        </div>
      </div>

      {/* ── 3. Filters, Search & Sorters ── */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, application ID, branch, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Profile Filter Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Verification Profiles</option>
              {Object.values(VERIFICATION_PROFILES).map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="priority">Sort: High Priority</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="amount">Sort: Loan Amount</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {STATUS_FILTERS.map((f) => {
            const count = f.id === "All"
              ? cases.length
              : cases.filter(c => f.id === "ASSIGNED" ? (c.status === "ASSIGNED" || c.status === "PENDING") : f.id === "COMPLETED" ? (c.status === "COMPLETED" || c.status === "APPROVED") : c.status === f.id).length;

            const isSelected = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-[#1E4DB7] text-white border-[#1E4DB7] shadow-sm"
                    : "bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100"
                )}
              >
                <span>{f.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isSelected ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Cases Display (Grid or List) ── */}
      {filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E4DB7] flex items-center justify-center mx-auto">
            <FiFilter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">No matching cases found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "All" || profileFilter !== "All"
                ? "Try adjusting your search criteria or clearing active filters."
                : "No verification cases are currently assigned to your queue."}
            </p>
          </div>
          {(search || statusFilter !== "All" || profileFilter !== "All") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); setProfileFilter("All"); }}
              className="text-xs font-bold text-[#1E4DB7] hover:underline pt-2 inline-block"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedCases.map((c) => {
              const profile = getProfileByCode(c.type);
              const statusStyle = STATUS_COLORS[c.status] || STATUS_COLORS.ASSIGNED;
              const isFinished = ["COMPLETED", "APPROVED", "REJECTED"].includes(c.status);

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row: App ID + Priority + Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-[#1E4DB7] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900">
                          {c.applicationId}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                          c.priority === "High" ? "bg-rose-100 text-rose-700" :
                          c.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                        )}>
                          {c.priority}
                        </span>
                      </div>

                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs"
                        style={{ color: statusStyle?.color, background: statusStyle?.bg }}
                      >
                        {statusStyle?.label || c.status}
                      </span>
                    </div>

                    {/* Customer Info & Avatar */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {c.customer.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          onClick={() => router.push(`/agent/cases/${c.id}`)}
                          className="text-[15px] font-bold text-gray-900 dark:text-slate-100 hover:text-[#1E4DB7] cursor-pointer truncate leading-snug"
                        >
                          {c.customer}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                            profile.badgeColor
                          )}>
                            {profile.name}
                          </span>
                          {c.branch && (
                            <span className="text-[10px] text-gray-400 truncate">
                              📍 {c.branch}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 bg-gray-50/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                      <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600 dark:text-slate-300 leading-snug line-clamp-2">{c.address}</p>
                    </div>

                    {/* Loan Details Strip */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Loan Purpose</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200 truncate block">{c.loanType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Loan Amount</span>
                        <span className="font-bold text-gray-900 dark:text-slate-100 block">
                          {c.loanAmount ? `₹${c.loanAmount.toLocaleString('en-IN')}` : "₹25,00,000"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* 1-Tap Call */}
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-emerald-200/60"
                          title={`Call ${c.phone}`}
                        >
                          <FiPhone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                      ) : (
                        <button disabled className="p-2 bg-gray-50 text-gray-300 rounded-xl text-xs cursor-not-allowed">
                          <FiPhone className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Google Maps Directions */}
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`, "_blank")}
                        className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-purple-200/60"
                        title="Navigate GPS"
                      >
                        <FiNavigation className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Route</span>
                      </button>

                      {/* Primary Button */}
                      <button
                        onClick={() => router.push(`/agent/verify/${c.id}`)}
                        className={cn(
                          "flex-1 py-2 px-3 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer",
                          isFinished ? "bg-slate-700 hover:bg-slate-800" : "bg-[#1E4DB7] hover:bg-blue-800"
                        )}
                      >
                        <span>{isFinished ? "View Evidence" : "Start Verification"}</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCases.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[6, 9, 15, 30]}
          />
        </div>
      ) : (
        /* ── COMPACT LIST VIEW ── */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-slate-800">
            {paginatedCases.map((c) => {
              const profile = getProfileByCode(c.type);
              const statusStyle = STATUS_COLORS[c.status] || STATUS_COLORS.ASSIGNED;
              const isFinished = ["COMPLETED", "APPROVED", "REJECTED"].includes(c.status);

              return (
                <div
                  key={c.id}
                  className="p-4 hover:bg-gray-50/80 dark:hover:bg-slate-900/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E4DB7] font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {c.customer.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-[#1E4DB7]">
                          {c.applicationId}
                        </span>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: statusStyle?.color, background: statusStyle?.bg }}
                        >
                          {statusStyle?.label || c.status}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-md border",
                          profile.badgeColor
                        )}>
                          {profile.name}
                        </span>
                      </div>

                      <h3
                        onClick={() => router.push(`/agent/cases/${c.id}`)}
                        className="text-[15px] font-bold text-gray-900 dark:text-slate-100 hover:text-[#1E4DB7] cursor-pointer leading-snug truncate"
                      >
                        {c.customer}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{c.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <div className="text-right hidden sm:block pr-2">
                      <span className="text-[10px] text-gray-400 block">Loan Amount</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        {c.loanAmount ? `₹${c.loanAmount.toLocaleString('en-IN')}` : "₹25,00,000"}
                      </span>
                    </div>

                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="p-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                        title="Call"
                      >
                        <FiPhone className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`, "_blank")}
                      className="p-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors"
                      title="Directions"
                    >
                      <FiNavigation className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => router.push(`/agent/verify/${c.id}`)}
                      className={cn(
                        "py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer",
                        isFinished ? "bg-slate-700 hover:bg-slate-800" : "bg-[#1E4DB7] hover:bg-blue-800"
                      )}
                    >
                      <span>{isFinished ? "View Details" : "Verify Case"}</span>
                      <FiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCases.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

    </div>
  );
}
