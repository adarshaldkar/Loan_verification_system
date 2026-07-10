"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiMapPin, FiChevronRight, FiFilter } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { getAgentCasesApi } from "@/lib/api";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type CaseStatus = "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "REJECTED" | "PENDING";
type CaseType   = "RESIDENTIAL" | "BUSINESS";

type AgentCase = {
  id: string;
  customer: string;
  phone: string;
  type: CaseType;
  address: string;
  loanType: string;
  loanAmount: number;
  status: CaseStatus;
  branch: string;
  assignedOn: string;
  mediaCount: number;
};

const STATUS_FILTERS = ["All", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "COMPLETED", "REJECTED"] as const;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED:    { label: "Assigned",    color: "#1E3A5F", bg: "#EEF2FF" },
  IN_PROGRESS: { label: "In Progress", color: "#7C3AED", bg: "#EDE9FE" },
  SUBMITTED:   { label: "Submitted",   color: "#0369A1", bg: "#E0F2FE" },
  COMPLETED:   { label: "Completed",   color: "#15803D", bg: "#DCFCE7" },
  REJECTED:    { label: "Rejected",    color: "#B91C1C", bg: "#FEE2E2" },
  PENDING:     { label: "Pending",     color: "#B45309", bg: "#FEF3C7" },
};

/* ─── Assigned Cases Page ────────────────────────────────────────────────── */
export default function AssignedCasesPage() {
  const router = useRouter();
  const [cases, setCases]     = useState<AgentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<string>("All");

  useEffect(() => {
    getAgentCasesApi()
      .then((res) => setCases(res.data.data ?? []))
      .catch(() => {
        toast.error("Session expired. Please log in.");
        router.push("/agent/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || c.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#1E4DB7]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Assigned Cases
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{filtered.length} of {cases.length} cases</p>
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
          </div>
        ) : (
          filtered.map((c) => {
            const style = STATUS_STYLE[c.status];
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
                      c.type === "RESIDENTIAL" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                    )}>
                      {c.type === "RESIDENTIAL" ? "Residential" : "Business"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                       {c.assignedOn}
                    </div>
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
