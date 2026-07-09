"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiFilter, FiMapPin, FiNavigation, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { getAgentCasesApi } from "@/lib/api";
import { toast } from "sonner";

type CaseStatus = "PENDING" | "ASSIGNED" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
type Priority = "High" | "Medium" | "Low";

interface Customer {
  id: string;
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
  createdAt: string;
  customer: Customer;
}

const STATUS_FILTERS = ["All", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "REJECTED"] as const;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:         { label: "Pending",     color: "#1E3A5F", bg: "#EEF2FF" },
  ASSIGNED:        { label: "Assigned",    color: "#1E3A5F", bg: "#EEF2FF" },
  TRAVELLING:      { label: "Travelling",  color: "#7C3AED", bg: "#EDE9FE" },
  AT_LOCATION:     { label: "At Location", color: "#0D9488", bg: "#CCFBF1" },
  IN_PROGRESS:     { label: "In Progress", color: "#D97706", bg: "#FEF3C7" },
  COMPLETED:       { label: "Completed",   color: "#0D9488", bg: "#CCFBF1" },
  REJECTED:        { label: "Rejected",    color: "#DC2626", bg: "#FEE2E2" },
};

export default function AssignedCasesPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [sortDist, setSortDist] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await getAgentCasesApi();
        if (res.data.success) {
          setCases(res.data.data);
        }
      } catch (err: any) {
        toast.error("Failed to load assigned cases.");
        if (err.response?.status === 401) {
          router.push("/agent/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const getPriority = (c: CaseItem): Priority => {
    if (c.customer.loanAmount > 1000000) return "High";
    if (c.customer.loanAmount > 500000) return "Medium";
    return "Low";
  };

  const getDistanceStr = (c: CaseItem): string => {
    const idNum = c.id.charCodeAt(c.id.length - 1) || 5;
    return `${(idNum % 8 + 1.2).toFixed(1)} km`;
  };

  const filtered = cases
    .filter((c) => {
      const customerName = `${c.customer.firstName} ${c.customer.lastName}`.toLowerCase();
      const matchSearch =
        customerName.includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.customer.address.toLowerCase().includes(search.toLowerCase());
      
      const matchFilter = filter === "All" || 
        (filter === "ASSIGNED" && (c.status === "ASSIGNED" || c.status === "PENDING")) ||
        (filter === "IN_PROGRESS" && ["TRAVELLING", "AT_LOCATION", "IN_PROGRESS"].includes(c.status)) ||
        c.status === filter;

      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortDist) {
        return parseFloat(getDistanceStr(a)) - parseFloat(getDistanceStr(b));
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[#1E3A5F] animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Loading cases list...</p>
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
            {f === "All" ? "All" : f === "ASSIGNED" ? "Assigned" : f === "IN_PROGRESS" ? "In Progress" : STATUS_STYLE[f]?.label ?? f}
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
            const style = STATUS_STYLE[c.status] || STATUS_STYLE["PENDING"];
            const priorityVal = getPriority(c);
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/agent/cases/${c.id}`)}
                className="w-full bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-transparent hover:border-slate-100"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">{c.id.slice(-12)}</span>
                    <p className="text-[15px] font-semibold text-slate-900 mt-0.5 leading-tight" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                      {c.customer.firstName} {c.customer.lastName}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 uppercase"
                    style={{ color: style?.color, background: style?.bg }}
                  >
                    {style?.label}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-1.5 mb-3">
                  <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-snug">{c.customer.address}</p>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {c.type === "RESIDENTIAL" ? "Residential" : "Business"}
                    </span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      priorityVal === "High" ? "bg-rose-50 text-rose-700" :
                      priorityVal === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {priorityVal}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <FiNavigation className="w-3 h-3" />
                      {getDistanceStr(c)}
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
