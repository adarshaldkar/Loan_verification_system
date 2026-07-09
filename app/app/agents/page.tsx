"use client";

import { useState } from "react";
import { FiSearch, FiEye, FiUserPlus, FiUserX, FiUserCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

type Agent = {
  id: string;
  name: string;
  phone: string;
  branch: string;
  status: "Active" | "Inactive";
  activeCases: number;
  completedCases: number;
  successRate: number;
  avgTurnaround: string;
};

const agents: Agent[] = [
  { id: "AGT-001", name: "Amit Kumar",    phone: "+91 98765 43210", branch: "Bangalore HQ", status: "Active",   activeCases: 5,  completedCases: 128, successRate: 95, avgTurnaround: "1.2 days" },
  { id: "AGT-002", name: "Ramesh Singh",  phone: "+91 87654 32109", branch: "Mumbai West",   status: "Active",   activeCases: 3,  completedCases: 112, successRate: 93, avgTurnaround: "1.4 days" },
  { id: "AGT-003", name: "Vikash Patel",  phone: "+91 76543 21098", branch: "Hyderabad",     status: "Active",   activeCases: 4,  completedCases: 98,  successRate: 90, avgTurnaround: "1.6 days" },
  { id: "AGT-004", name: "Suresh Yadav",  phone: "+91 65432 10987", branch: "Delhi North",   status: "Active",   activeCases: 2,  completedCases: 87,  successRate: 89, avgTurnaround: "1.8 days" },
  { id: "AGT-005", name: "Manoj Tiwari",  phone: "+91 54321 09876", branch: "Pune",          status: "Active",   activeCases: 6,  completedCases: 76,  successRate: 88, avgTurnaround: "2.0 days" },
  { id: "AGT-006", name: "Deepa Nair",    phone: "+91 43210 98765", branch: "Chennai South", status: "Inactive", activeCases: 0,  completedCases: 54,  successRate: 82, avgTurnaround: "2.1 days" },
];

/* ─── Agents Page ────────────────────────────────────────────────────────── */

const PAGE_SIZE = 4;

export default function AgentsPage() {
  const [search, setSearch]     = useState("");
  const [agentList, setAgentList] = useState<Agent[]>(agents);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [page, setPage]         = useState(1);

  const filtered = agentList.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.branch.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Manage the field agent roster, workload, and performance."
        action={
          <Button
            className="text-white gap-2"
            style={{ background: "#1E3A5F" }}
            onClick={() => toast.info("Add Agent form coming soon")}
          >
            <FiUserPlus className="w-4 h-4" />
            Add Agent
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search agents or branch…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Agent", "Branch", "Status", "Active Cases", "Completed", "Success Rate", "Avg. Turnaround", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(a)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{a.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{a.branch}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      a.status === "Active" ? "badge-completed" : "badge-rejected"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-900 font-semibold">{a.activeCases}</td>
                  <td className="px-5 py-4 text-slate-900 font-semibold">{a.completedCases}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 w-10 shrink-0">{a.successRate}%</span>
                      <Progress value={a.successRate} className="h-1.5 w-20" />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{a.avgTurnaround}</td>
                  <td className="px-5 py-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(a)}>
                      <FiEye className="w-4 h-4 text-slate-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} agents
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              disabled={safePage === 1}
              onClick={() => goTo(safePage - 1)}
            >
              <FiChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={`h-7 w-7 p-0 text-xs font-semibold ${
                  p === safePage ? "text-white border-[#1E3A5F]" : "text-slate-700 hover:bg-slate-50"
                }`}
                style={p === safePage ? { background: "#1E3A5F" } : {}}
                onClick={() => goTo(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline" size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              disabled={safePage === totalPages}
              onClick={() => goTo(safePage + 1)}
            >
              Next <FiChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Agent Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[480px]">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="text-lg font-bold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                      {selected.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">{selected.name}</SheetTitle>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.id}</p>
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selected.status === "Active" ? "badge-completed" : "badge-rejected"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {selected.status}
                    </span>
                  </div>
                </div>
              </SheetHeader>
              <Separator className="mb-6" />
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Branch",           value: selected.branch },
                    { label: "Phone",            value: selected.phone },
                    { label: "Active Cases",     value: selected.activeCases },
                    { label: "Completed Cases",  value: selected.completedCases },
                    { label: "Avg. Turnaround",  value: selected.avgTurnaround },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 mb-1">Success Rate</p>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{selected.successRate}%</p>
                    <Progress value={selected.successRate} className="h-1.5" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button
                  className="flex-1 text-white"
                  style={{ background: "#1E3A5F" }}
                  onClick={() => {
                    setSelected(null);
                    toast.info(`Opening case history for ${selected.name}`);
                  }}
                >
                  View Case History
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 gap-2 ${
                    selected.status === "Active"
                      ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                      : "text-teal-600 border-teal-200 hover:bg-teal-50"
                  }`}
                  onClick={() => {
                    const next = selected.status === "Active" ? "Inactive" : "Active";
                    const updated = agentList.map((a) =>
                      a.id === selected.id ? { ...a, status: next as Agent["status"] } : a
                    );
                    setAgentList(updated);
                    setSelected({ ...selected, status: next as Agent["status"] });
                    toast.success(
                      `Agent ${selected.name} has been ${
                        next === "Inactive" ? "deactivated" : "reactivated"
                      }.`
                    );
                  }}
                >
                  {selected.status === "Active" ? (
                    <><FiUserX className="w-4 h-4" /> Deactivate</>
                  ) : (
                    <><FiUserCheck className="w-4 h-4" /> Reactivate</>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
