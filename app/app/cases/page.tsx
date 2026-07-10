"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiSearch, FiFilter, FiEye, FiUserPlus, FiFile } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type VerificationStatus } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCasesApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Case = {
  id: string;
  customer: string;
  type: "Residential" | "Business";
  status: VerificationStatus;
  agent: string;
  branch: string;
  slaDue: string;
  overdue: boolean;
};

/* ─── Cases Page ─────────────────────────────────────────────────────────── */

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [casesList, setCasesList] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true);
        const mapStatus = (s: string) => {
          if (s === "Pending") return "PENDING";
          if (s === "In Progress") return "IN_PROGRESS";
          if (s === "Completed") return "COMPLETED";
          if (s === "Rejected") return "REJECTED";
          return "All";
        };
        const res = await getCasesApi(mapStatus(statusFilter));
        setCasesList(res.data.data);
      } catch (err) {
        toast.error("Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [statusFilter]);

  const filtered = casesList.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        description="Manage and assign all verification cases."
        action={
          <Button className="bg-[--color-brand-900] hover:bg-[--color-brand-800] text-white gap-2">
            <FiUserPlus className="w-4 h-4" />
            Assign Cases
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by Case ID or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-44">
            <FiFilter className="w-4 h-4 text-slate-400 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Case ID", "Customer", "Type", "Status", "Assigned Agent", "Branch", "SLA Due", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-7 rounded-md" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No cases found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "hover:bg-slate-50 cursor-pointer transition-colors",
                      c.overdue && "bg-amber-50 hover:bg-amber-100"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                        <FiFile className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        {c.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{c.customer}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.type}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5 text-slate-500">{c.agent}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.branch}</td>
                    <td className={cn("px-5 py-3.5 text-xs whitespace-nowrap", c.overdue ? "text-amber-700 font-semibold" : "text-slate-400")}>
                      {c.overdue && "⚠ "}
                      {c.slaDue}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/app/cases/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FiEye className="w-4 h-4 text-slate-400" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length} of {casesList.length} cases
            {filtered.some((c) => c.overdue) && (
              <span className="ml-3 text-amber-700 font-medium">
                ⚠ {filtered.filter((c) => c.overdue).length} overdue
              </span>
            )}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs bg-[--color-brand-900] text-white border-[--color-brand-900]">1</Button>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
