"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiFilter, FiMapPin, FiNavigation, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

/* ─── Mock Cases ─────────────────────────────────────────────────────────── */

type CaseStatus = "ASSIGNED" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "RE_VERIFICATION";
type CaseType   = "RESIDENTIAL" | "BUSINESS";
type Priority   = "High" | "Medium" | "Low";

type AgentCase = {
  id: string;
  customer: string;
  type: CaseType;
  address: string;
  priority: Priority;
  distance: string;
  status: CaseStatus;
  assignedOn: string;
};

const allCases: AgentCase[] = [
  { id: "LV-2026-10821", customer: "Priya Sharma",   type: "RESIDENTIAL", address: "45 Park St, Dadar, Mumbai",         priority: "High",   distance: "3.2 km", status: "ASSIGNED",       assignedOn: "Today, 09:00 AM" },
  { id: "LV-2026-10819", customer: "Sandeep Yadav",  type: "BUSINESS",    address: "78 Civil Lines, Connaught, Delhi",   priority: "High",   distance: "8.7 km", status: "IN_PROGRESS",    assignedOn: "Today, 08:30 AM" },
  { id: "LV-2026-10817", customer: "Rahul Gupta",    type: "RESIDENTIAL", address: "23 Station Rd, Kothrud, Pune",       priority: "Medium", distance: "5.1 km", status: "SUBMITTED",      assignedOn: "Yesterday" },
  { id: "LV-2026-10816", customer: "Kavita Singh",   type: "RESIDENTIAL", address: "56 Lake View, Adyar, Chennai",       priority: "Low",    distance: "12 km",  status: "COMPLETED",      assignedOn: "07 Jul 2026" },
  { id: "LV-2026-10814", customer: "Arvind Patel",   type: "BUSINESS",    address: "89 Gandhi Nagar, CG Road, Ahmedabad",priority: "Medium", distance: "6.4 km", status: "RE_VERIFICATION", assignedOn: "06 Jul 2026" },
  { id: "LV-2026-10813", customer: "Sunita Joshi",   type: "RESIDENTIAL", address: "34 Mall Rd, Vaishali Nagar, Jaipur", priority: "Low",    distance: "9.2 km", status: "ASSIGNED",       assignedOn: "06 Jul 2026" },
  { id: "LV-2026-10811", customer: "Manoj Tiwari",   type: "BUSINESS",    address: "12 MIDC Area, Andheri East, Mumbai", priority: "High",   distance: "4.8 km", status: "TRAVELLING",     assignedOn: "05 Jul 2026" },
  { id: "LV-2026-10809", customer: "Deepa Nair",     type: "RESIDENTIAL", address: "67 Anna Nagar, West, Chennai",       priority: "Medium", distance: "7.6 km", status: "ASSIGNED",       assignedOn: "05 Jul 2026" },
];

const STATUS_FILTERS = ["All", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "COMPLETED", "RE_VERIFICATION"] as const;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED:        { label: "Assigned",    color: "#1E3A5F", bg: "#EEF2FF" },
  TRAVELLING:      { label: "Travelling",  color: "#7C3AED", bg: "#EDE9FE" },
  AT_LOCATION:     { label: "At Location", color: "#0D9488", bg: "#CCFBF1" },
  IN_PROGRESS:     { label: "In Progress", color: "#D97706", bg: "#FEF3C7" },
  SUBMITTED:       { label: "Submitted",   color: "#2563EB", bg: "#DBEAFE" },
  COMPLETED:       { label: "Completed",   color: "#0D9488", bg: "#CCFBF1" },
  RE_VERIFICATION: { label: "Re-verify",   color: "#DC2626", bg: "#FEE2E2" },
};

/* ─── Assigned Cases Page ────────────────────────────────────────────────── */
export default function AssignedCasesPage() {
  const router = useRouter();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<string>("All");
  const [sortDist, setSortDist] = useState(false);

  const filtered = allCases
    .filter((c) => {
      const matchSearch =
        c.customer.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "All" || c.status === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      sortDist
        ? parseFloat(a.distance) - parseFloat(b.distance)
        : 0
    );

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Assigned Cases
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{filtered.length} of {allCases.length} cases</p>
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
        <button
          onClick={() => setSortDist(!sortDist)}
          className={cn(
            "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all",
            sortDist ? "text-white" : "bg-white text-slate-500 border border-slate-200"
          )}
          style={sortDist ? { background: "#0D9488" } : {}}
        >
          <FiNavigation className="w-3 h-3" /> Nearest
        </button>
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
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      c.priority === "High" ? "bg-rose-50 text-rose-700" :
                      c.priority === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {c.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <FiNavigation className="w-3 h-3" />
                      {c.distance}
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
