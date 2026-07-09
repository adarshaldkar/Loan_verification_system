"use client";

import { useState } from "react";
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

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

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

const cases: Case[] = [
  { id: "LV-2026-10820", customer: "Amit Kumar",    type: "Residential", status: "Pending",     agent: "Not Assigned",  branch: "Bangalore HQ", slaDue: "20 May 2026", overdue: false },
  { id: "LV-2026-10819", customer: "Priya Sharma",  type: "Business",    status: "In Progress",  agent: "Ramesh Singh",  branch: "Mumbai West",   slaDue: "19 May 2026", overdue: false },
  { id: "LV-2026-10818", customer: "Sandeep Yadav", type: "Residential", status: "Completed",    agent: "Amit Kumar",    branch: "Delhi North",   slaDue: "18 May 2026", overdue: false },
  { id: "LV-2026-10817", customer: "Neha Verma",    type: "Business",    status: "Rejected",     agent: "Vikash Patel",  branch: "Hyderabad",     slaDue: "16 May 2026", overdue: true  },
  { id: "LV-2026-10816", customer: "Rahul Gupta",   type: "Residential", status: "Pending",     agent: "Not Assigned",  branch: "Pune",          slaDue: "15 May 2026", overdue: true  },
  { id: "LV-2026-10815", customer: "Kavita Singh",  type: "Business",    status: "Completed",    agent: "Suresh Yadav",  branch: "Chennai South", slaDue: "17 May 2026", overdue: false },
  { id: "LV-2026-10814", customer: "Arvind Patel",  type: "Residential", status: "In Progress",  agent: "Manoj Tiwari",  branch: "Ahmedabad",     slaDue: "21 May 2026", overdue: false },
  { id: "LV-2026-10813", customer: "Sunita Joshi",  type: "Business",    status: "Pending",     agent: "Not Assigned",  branch: "Jaipur",        slaDue: "14 May 2026", overdue: true  },
];

/* ─── Cases Page ─────────────────────────────────────────────────────────── */

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = cases.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchType = typeFilter === "All" || c.type === typeFilter;
    return matchSearch && matchStatus && matchType;
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
              {filtered.length === 0 ? (
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
                        {c.id}
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
            Showing {filtered.length} of {cases.length} cases
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
