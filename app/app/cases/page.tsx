"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FiSearch, FiFilter, FiEye, FiUserPlus, FiFile, FiRefreshCw, FiCheck } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type VerificationStatus } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCasesApi, getAgentsApi, batchAssignCasesApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Case = {
  id: string;
  customer: string;
  type: "Residential" | "Business";
  status: VerificationStatus;
  agent: string;
  agentId: string | null;
  branch: string;
  slaDue: string;
  overdue: boolean;
};

export default function CasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [casesList, setCasesList] = useState<Case[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pending unsaved assignments: caseId -> agentId
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchCases = useCallback(async () => {
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
  }, [statusFilter]);

  useEffect(() => {
    fetchCases();
    getAgentsApi().then((res) => {
      const activeAgents = res.data.data.filter((a: any) => a.status === 'Active');
      setAgents(activeAgents);
    }).catch(() => {});
  }, [fetchCases]);

  const handleSelectPendingAgent = (caseId: string, agentId: string) => {
    const originalCase = casesList.find((c) => c.id === caseId);
    const originalAgentId = originalCase?.agentId || "unassigned";

    if (agentId === originalAgentId) {
      setPendingAssignments((prev) => {
        const next = { ...prev };
        delete next[caseId];
        return next;
      });
    } else {
      setPendingAssignments((prev) => ({
        ...prev,
        [caseId]: agentId,
      }));
    }
  };

  const handleSaveAllAssignments = async () => {
    const payload: Record<string, string> = {};
    Object.entries(pendingAssignments).forEach(([caseId, agentId]) => {
      if (agentId !== "unassigned") {
        payload[caseId] = agentId;
      }
    });

    if (Object.keys(payload).length === 0) {
      toast.warning("No active agent selections to save.");
      return;
    }

    try {
      setSaving(true);
      const res = await batchAssignCasesApi(payload);
      toast.success(res.data.message || "Assignments saved successfully");
      setPendingAssignments({});
      fetchCases();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save assignments");
    } finally {
      setSaving(false);
    }
  };

  const getAgentDisplayName = (caseId: string, caseAgentId: string | null, originalAgentName: string) => {
    const selectedId = pendingAssignments[caseId] || caseAgentId || "unassigned";
    if (selectedId === "unassigned") return "Unassigned";

    // Find in currently loaded agents
    const agentObj = agents.find((a) => a.id === selectedId);
    if (agentObj) return agentObj.name;

    // Fallback to pre-fetched name if we are resolving the original assigned agent
    if (selectedId === caseAgentId) {
      return originalAgentName && originalAgentName !== "Not Assigned" && originalAgentName !== "Unassigned"
        ? originalAgentName
        : "Unassigned";
    }

    return selectedId; // Fallback to ID if no name is available
  };

  const filtered = casesList.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 relative pb-20">
      <PageHeader
        title="Cases"
        description="Manage and assign all verification cases."
        action={
          <div className="flex gap-3">
            {Object.keys(pendingAssignments).length > 0 && (
              <Button
                onClick={handleSaveAllAssignments}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-semibold shadow-md"
              >
                {saving ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Save Assignments ({Object.keys(pendingAssignments).length})
                  </>
                )}
              </Button>
            )}
            <Link href="/app/upload">
              <Button className="bg-[--color-brand-900] hover:bg-[--color-brand-800] text-white gap-2">
                <FiUserPlus className="w-4 h-4" />
                Upload & Bulk Assign
              </Button>
            </Link>
          </div>
        }
      />

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

      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-slate-900/50">
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
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
                filtered.map((c) => {
                  const hasUnsavedChange = pendingAssignments[c.id] !== undefined && pendingAssignments[c.id] !== (c.agentId || "unassigned");
                  const displayName = getAgentDisplayName(c.id, c.agentId, c.agent);

                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        c.overdue && "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40",
                        hasUnsavedChange && "bg-blue-50/20 dark:bg-blue-950/10"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                          <FiFile className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          {c.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-200">{c.customer}</td>
                      <td className="px-5 py-3.5 text-slate-500">{c.type}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5">
                        <Select
                          value={pendingAssignments[c.id] || c.agentId || "unassigned"}
                          onValueChange={(val) => handleSelectPendingAgent(c.id, val)}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 text-xs w-[180px] bg-white dark:bg-slate-900 border transition-all justify-between text-left",
                              hasUnsavedChange
                                ? "border-blue-500 ring-1 ring-blue-500/35 bg-blue-50/10 dark:bg-blue-950/20 font-semibold text-blue-600 dark:text-blue-400"
                                : "border-slate-200 dark:border-slate-800"
                            )}
                          >
                            <span className="truncate">{displayName}</span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned" className="text-xs text-slate-400">
                              Unassigned
                            </SelectItem>
                            {agents.map((a) => (
                              <SelectItem key={a.id} value={a.id} className="text-xs">
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{c.branch}</td>
                      <td className={cn("px-5 py-3.5 text-xs whitespace-nowrap", c.overdue ? "text-amber-700 dark:text-amber-500 font-semibold" : "text-slate-400 dark:text-slate-500")}>
                        {c.overdue && "⚠ "}
                        {c.slaDue}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/app/cases/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FiEye className="w-4 h-4 text-slate-400" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
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

      {/* Floating Save Action Bar */}
      {Object.keys(pendingAssignments).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md px-6 py-3.5 rounded-full border border-slate-700/50 shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-medium text-slate-200">
            {Object.keys(pendingAssignments).length} pending {Object.keys(pendingAssignments).length === 1 ? 'assignment' : 'assignments'}
          </span>
          <div className="flex gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5 h-8 rounded-full"
              onClick={() => setPendingAssignments({})}
              disabled={saving}
            >
              Discard
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 h-8 rounded-full shadow-lg flex items-center gap-1.5"
              onClick={handleSaveAllAssignments}
              disabled={saving}
            >
              {saving ? (
                <>
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
