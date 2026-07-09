"use client";

import { useState } from "react";
import { FiSearch, FiFilter, FiDownload } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

const auditLogs = [
  { actor: "Rohit Admin",  action: "Approved verification",  entity: "Case LV-2026-10818",   timestamp: "2026-05-18 09:20:14", ip: "192.168.1.10" },
  { actor: "Amit Kumar",   action: "Submitted verification", entity: "Case LV-2026-10818",    timestamp: "2026-05-18 09:15:02", ip: "10.0.0.45"    },
  { actor: "Rohit Admin",  action: "Assigned case",          entity: "Case LV-2026-10819",    timestamp: "2026-05-18 08:30:55", ip: "192.168.1.10" },
  { actor: "System",       action: "Excel import completed", entity: "Batch customers_may_18", timestamp: "2026-05-18 08:00:00", ip: "system"       },
  { actor: "Rohit Admin",  action: "Registered new agent",   entity: "Agent Suresh Yadav",    timestamp: "2026-05-17 05:12:34", ip: "192.168.1.10" },
  { actor: "Vikash Patel", action: "Rejected verification",  entity: "Case LV-2026-10817",    timestamp: "2026-05-17 04:45:11", ip: "10.0.0.22"    },
  { actor: "Rohit Admin",  action: "Deactivated branch",     entity: "Branch: Kolkata",        timestamp: "2026-05-16 03:00:00", ip: "192.168.1.10" },
  { actor: "System",       action: "Scheduled backup run",   entity: "DB Backup",              timestamp: "2026-05-16 02:00:00", ip: "system"       },
];

/* ─── Audit Logs Page ────────────────────────────────────────────────────── */

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("All");

  const filtered = auditLogs.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase());
    const matchActor = actorFilter === "All" || l.actor === actorFilter;
    return matchSearch && matchActor;
  });

  const uniqueActors = Array.from(new Set(auditLogs.map((l) => l.actor)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit History"
        description="Immutable log of every meaningful action in the Admin Panel."
        action={
          <Button variant="outline" className="gap-2 text-sm">
            <FiDownload className="w-4 h-4" />
            Export Log
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search actions, actors, entities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actorFilter} onValueChange={(v) => v && setActorFilter(v)}>
          <SelectTrigger className="w-48">
            <FiFilter className="w-4 h-4 text-slate-400 mr-1" />
            <SelectValue placeholder="Actor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Actors</SelectItem>
            {uniqueActors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Actor", "Action", "Target Entity", "Timestamp", "IP Address"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No log entries match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.actor === "System" ? "bg-slate-100 text-slate-500" : "bg-[--color-brand-50] text-[--color-brand-900]"}`}>
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{log.action}</td>
                    <td className="px-5 py-3.5 text-slate-500">{log.entity}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-500">{log.timestamp}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-400">{log.ip}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border text-xs text-slate-500">
          {filtered.length} entries
        </div>
      </div>
    </div>
  );
}
