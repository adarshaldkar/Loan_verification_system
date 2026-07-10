"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiFilter, FiMapPin, FiNavigation, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentCasesApi } from "@/lib/api";
import { toast } from "sonner";

type CaseStatus = "ASSIGNED" | "PENDING" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "RE_VERIFICATION" | "REJECTED";
type CaseType   = "RESIDENTIAL" | "BUSINESS" | "ADDRESS";

type AgentCase = {
  id: string;
  customer: string;
  type: CaseType;
  address: string;
  priority: "High" | "Medium" | "Low";
  status: CaseStatus;
  assignedOn: string;
  loanType: string;
  branch: string;
};

const STATUS_FILTERS = ["All", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "COMPLETED", "REJECTED"] as const;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:         { label: "Pending",     color: "#7C3AED", bg: "#EDE9FE" },
  ASSIGNED:        { label: "Assigned",    color: "#1E3A5F", bg: "#EEF2FF" },
  TRAVELLING:      { label: "Travelling",  color: "#7C3AED", bg: "#EDE9FE" },
  AT_LOCATION:     { label: "At Location", color: "#0D9488", bg: "#CCFBF1" },
  IN_PROGRESS:     { label: "In Progress", color: "#D97706", bg: "#FEF3C7" },
  SUBMITTED:       { label: "Submitted",   color: "#2563EB", bg: "#DBEAFE" },
  COMPLETED:       { label: "Completed",   color: "#0D9488", bg: "#CCFBF1" },
  RE_VERIFICATION: { label: "Re-verify",   color: "#DC2626", bg: "#FEE2E2" },
  REJECTED:        { label: "Rejected",    color: "#DC2626", bg: "#FEE2E2" },
};

function getPriority(status: CaseStatus): "High" | "Medium" | "Low" {
  if (status === "PENDING" || status === "ASSIGNED") return "High";
  if (status === "IN_PROGRESS" || status === "RE_VERIFICATION") return "Medium";
  return "Low";
}

/* ─── Assigned Cases Page ────────────────────────────────────────────────── */
export default function AssignedCasesPage() {
  const router = useRouter();
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<string>("All");
  const [loading, setLoading]   = useState(true);
  const [cases, setCases]       = useState<AgentCase[]>([]);
  const [error, setError]       = useState<string | null>(null);

  async function fetchCases() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAgentCasesApi();
      const fetched: AgentCase[] = (res.data.data || []).map((c: any) => ({
        id: c.id,
        customer: c.customer,
        type: c.type as CaseType,
        address: c.address,
        priority: getPriority(c.status),
        status: c.status as CaseStatus,
        assignedOn: c.assignedOn,
        loanType: c.loanType,
        branch: c.branch,
      }));
      setCases(fetched);
    } catch (err: any) {
      console.error("Failed to load cases:", err);
      const msg = err?.response?.data?.message || "Failed to load assigned cases";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>

        {/* Filter Badges Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Search Row Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>

        {/* Cases List Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
          <FiFilter className="w-8 h-8 text-rose-400" />
        </div>
        <p className="text-slate-600 font-medium">Could not load assigned cases</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={fetchCases}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl"
          style={{ background: "#1E3A5F" }}
        >
          <FiRefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Assigned Cases
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} of {cases.length} cases</p>
        </div>
        <button
          onClick={fetchCases}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
          title="Refresh"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, case ID, or address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all shadow-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all",
              filter === f
                ? "text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200"
            )}
            style={filter === f ? { background: "#1E3A5F" } : {}}
          >
            {f === "All" ? "All" : STATUS_STYLE[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <FiFilter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No cases found</p>
            {cases.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No cases are currently assigned to you</p>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const style = STATUS_STYLE[c.status] || STATUS_STYLE.ASSIGNED;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/agent/cases/${c.id}`)}
                className="w-full bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-transparent hover:border-slate-100"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">{c.id}</span>
                    <p className="text-[15px] font-semibold text-slate-900 mt-0.5 leading-tight" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                      {c.customer}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ml-2"
                    style={{ color: style?.color, background: style?.bg }}
                  >
                    {style?.label}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1.5 mb-3">
                  <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-snug">{c.address}</p>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      c.type === "RESIDENTIAL" || c.type === "ADDRESS" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                    )}>
                      {c.type === "BUSINESS" ? "Business" : "Residential"}
                    </span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      c.priority === "High" ? "bg-rose-50 text-rose-700" :
                      c.priority === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {c.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{c.branch}</span>
                    <FiChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
