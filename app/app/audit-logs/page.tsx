"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiDownload, FiChevronDown } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { getAuditLogsApi } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

function downloadBlob(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPDF(htmlContent: string, filename: string) {
  const runExport = () => {
    const element = document.createElement("div");
    element.innerHTML = htmlContent;
    
    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: "jpeg", quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" }
    };
    
    // @ts-ignore
    window.html2pdf().from(element).set(opt).save().then(() => {
      toast.success(`Downloaded ${filename} successfully`);
    }).catch((err: any) => {
      console.error(err);
      toast.error("Failed to generate PDF");
    });
  };

  // @ts-ignore
  if (window.html2pdf) {
    runExport();
  } else {
    toast.info("Preparing PDF engine...");
    const script = document.createElement("script");
    script.src = "/js/html2pdf.bundle.min.js";
    script.onload = () => {
      runExport();
    };
    script.onerror = () => {
      toast.error("Failed to load local PDF generation library.");
    };
    document.body.appendChild(script);
  }
}

/* ─── Audit Logs Page ────────────────────────────────────────────────────── */

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("All");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogsApi();
      setAuditLogs(res.data.data);
    } catch (err) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = auditLogs.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase());
    const matchActor = actorFilter === "All" || l.actor === actorFilter;
    return matchSearch && matchActor;
  });

  const uniqueActors = Array.from(new Set(auditLogs.map((l) => l.actor)));

  const handleExport = (format: "excel" | "pdf") => {
    if (filtered.length === 0) {
      toast.error("No entries to export");
      return;
    }

    if (format === "excel") {
      const headers = ["Actor", "Action", "Target Entity", "Timestamp", "IP Address"];
      const rows = filtered.map((log) => {
        let formattedTime = log.timestamp;
        try {
          const d = new Date(log.timestamp);
          if (!isNaN(d.getTime())) {
            formattedTime = new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(d);
          }
        } catch {}

        return [
          log.actor || "",
          log.action || "",
          log.entity || "",
          formattedTime || "",
          log.ip || ""
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
      XLSX.writeFile(wb, `Audit_Log_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Audit Log exported successfully as Excel (XLSX)");
    } else {
      // PDF format
      const rowsHtml = filtered.map((log) => {
        let formattedTime = log.timestamp;
        try {
          const d = new Date(log.timestamp);
          if (!isNaN(d.getTime())) {
            formattedTime = new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(d);
          }
        } catch {}

        return `
          <tr>
            <td><strong>${log.actor}</strong></td>
            <td>${log.action}</td>
            <td>${log.entity}</td>
            <td style="white-space: nowrap;">${formattedTime}</td>
            <td><code>${log.ip}</code></td>
          </tr>
        `;
      }).join("");

      const html = `
        <html>
          <head>
            <title>Audit Logs History</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
              .header h1 { margin: 0; color: #1e3a5f; font-size: 22px; font-weight: 700; }
              .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 11px; }
              th { background-color: #f8fafc; font-weight: 600; color: #475569; }
              .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Audit Logs History</h1>
              <div class="meta">
                Generated by: Admin | Date: ${new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date())} | Total Records: ${filtered.length}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Timestamp</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <div class="footer">
              Loan Verification Management System • Immutable Activity Trail
            </div>
          </body>
        </html>
      `;
      downloadPDF(html, `Audit_Log_Export_${new Date().toISOString().split("T")[0]}.pdf`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit History"
        description="Immutable log of every meaningful action in the Admin Panel."
        action={
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2 text-sm text-white cursor-pointer")}
              style={{ background: "#1E3A5F" }}
            >
              <FiDownload className="w-4 h-4" />
              Export Log
              <FiChevronDown className="w-4 h-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExport("excel")} className="cursor-pointer">
                Excel Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer">
                PDF Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No log entries match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${log.actor === "System" ? "bg-slate-100 text-slate-500" : "bg-[--color-brand-50] text-[--color-brand-900]"}`}>
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{log.action}</td>
                    <td className="px-5 py-3.5 text-slate-500">{log.entity}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-slate-600">
                        {(() => {
                          try {
                            const d = new Date(log.timestamp);
                            if (isNaN(d.getTime())) return log.timestamp;
                            return new Intl.DateTimeFormat("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }).format(d);
                          } catch {
                            return log.timestamp;
                          }
                        })()}
                      </span>
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
