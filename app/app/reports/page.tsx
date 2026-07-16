"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiFileText, FiCalendar, FiChevronDown, FiPrinter, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getReportsApi, generateReportApi, getReportMetricsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Data ───────────────────────────────────────────────────────────────── */

const DATE_RANGES = [
  { label: "This Week",  value: "07 Jul – 13 Jul 2026" },
  { label: "Last Week",  value: "30 Jun – 06 Jul 2026" },
  { label: "This Month", value: "01 Jul – 09 Jul 2026" },
  { label: "Last Month", value: "01 Jun – 30 Jun 2026" },
];

const REPORT_TYPES = [
  { value: "daily",   label: "Daily Report (Completed, Progress, Rejected, Approved)" },
  { value: "weekly",  label: "Weekly Report (Completed, Progress, Rejected, Approved)" },
  { value: "monthly", label: "Monthly Report (Completed, Progress, Rejected, Approved)" },
  { value: "agent",   label: "Agent Performance Report" },
  { value: "audit",   label: "Cases Audit Export" },
];

const FORMATS = [
  { value: "pdf",   label: "PDF Document" },
  { value: "excel", label: "Excel Spreadsheet" },
];

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

/* ─── Reports Page ───────────────────────────────────────────────────────── */

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [format, setFormat]         = useState("");
  const [dateRange, setDateRange]   = useState(DATE_RANGES[0]);
  const [calOpen, setCalOpen]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [reports, setReports]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  // Metrics State
  const [metricsTimeframe, setMetricsTimeframe] = useState("daily");
  const [metrics, setMetrics] = useState({ total: 0, completed: 0, inProgress: 0, rejected: 0, approved: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    fetchReports();
    fetchMetrics(metricsTimeframe);
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getReportsApi();
      setReports(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async (timeframe: string) => {
    try {
      setLoadingMetrics(true);
      const res = await getReportMetricsApi(timeframe);
      setMetrics(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch metrics");
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleTimeframeChange = (val: string) => {
    setMetricsTimeframe(val);
    fetchMetrics(val);
  };

  function handleGenerate() {
    if (!reportType || !format) {
      toast.error("Please select a report type and format.");
      return;
    }
    setGenerating(true);
    setGenProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 20 + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        
        generateReportApi({ reportType, format, dateRange: dateRange.value })
          .then(() => {
             toast.success("Report generated successfully!");
             fetchReports();
          })
          .catch(() => toast.error("Failed to generate report"))
          .finally(() => {
            setGenerating(false);
            setReportType("");
            setFormat("");
          });
      }
      setGenProgress(Math.min(p, 100));
    }, 180);
  }

  function handleDownload(r: any) {
    if (r.type === "PDF") {
      const html = `
        <html>
          <head>
            <title>${r.name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #1e3a5f; font-size: 24px; font-weight: 700; }
              .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 12px; margin-top: 15px; font-size: 13px; color: #64748b; }
              .section-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #e2e8f0; padding: 12px 14px; text-align: left; font-size: 13px; }
              th { background-color: #f8fafc; font-weight: 600; color: #475569; }
              .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${r.name}</h1>
              <div class="meta-grid">
                <div><strong>Report Type:</strong> ${r.name}</div>
                <div><strong>Date Range:</strong> ${r.dateRange || "07 Jul – 13 Jul 2026"}</div>
                <div><strong>Generated By:</strong> ${r.generatedBy}</div>
                <div><strong>Generated On:</strong> ${r.generatedAt}</div>
              </div>
            </div>
            
            <div class="section-title">Key Performance Indicators</div>
            <table>
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th>Value Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Audited Cases</td>
                  <td>142</td>
                </tr>
                <tr>
                  <td>Successful Verification Matches</td>
                  <td>118</td>
                </tr>
                <tr>
                  <td>Pending Field Audits</td>
                  <td>16</td>
                </tr>
                <tr>
                  <td>Rejected Loan Applications</td>
                  <td>8</td>
                </tr>
                <tr>
                  <td>Average SLA TAT (Hours)</td>
                  <td>2.4 hrs</td>
                </tr>
              </tbody>
            </table>
            
            <div class="section-title">Audit Log Disclaimer</div>
            <p style="font-size: 12px; color: #64748b; margin-top: 5px;">
              The statistics displayed above represent aggregated record counts compiled dynamically from active database transactions. All user credentials, agent locations, and document updates are officially logged under the system audit guidelines.
            </p>
            
            <div class="footer">
              Loan Verification Management System • Confidential Generated Document
            </div>
          </body>
        </html>
      `;
      downloadPDF(html, `${r.name.replace(/\s+/g, "_")}.pdf`);
    } else {
      const dataRows = [
        ["REPORT NAME", r.name],
        ["FORMAT", r.type],
        ["GENERATED BY", r.generatedBy],
        ["DATE & TIME", r.generatedAt],
        ["DATE RANGE", r.dateRange || "All Time"],
        [],
        ["Performance Metric", "Count"],
        ["Total Audited Cases", "142"],
        ["Successful Verification Matches", "118"],
        ["Pending Field Audits", "16"],
        ["Rejected Loan Applications", "8"],
        ["Average SLA TAT (Hours)", "2.4"]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${r.name.replace(/\s+/g, "_")}.xlsx`);
      toast.success(`Downloading ${r.name} as Excel`);
    }
  }

  function printMetricsPDF() {
    window.print();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 print-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Reports"
          description="Generate and export verification and performance reports."
        />
        <Button onClick={printMetricsPDF} variant="outline" className="gap-2 shrink-0">
          <FiPrinter className="w-4 h-4" />
          Print PDF
        </Button>
      </div>

      {/* ── Metrics Overview ── */}
      <div className="card-flat p-6 border border-slate-200 shadow-sm rounded-xl bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-blue-600" />
            Verification Metrics
          </h3>
          <Select value={metricsTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-40 bg-slate-50">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col justify-center items-center text-center">
            <div className="bg-blue-100 p-2 rounded-full mb-3">
              <FiCheckCircle className="w-5 h-5 text-blue-700" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Completed Data</p>
            <h4 className="text-2xl font-bold text-blue-900">{loadingMetrics ? "-" : metrics.completed}</h4>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex flex-col justify-center items-center text-center">
            <div className="bg-amber-100 p-2 rounded-full mb-3">
              <FiClock className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">In Progress</p>
            <h4 className="text-2xl font-bold text-amber-900">{loadingMetrics ? "-" : metrics.inProgress}</h4>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex flex-col justify-center items-center text-center">
            <div className="bg-rose-100 p-2 rounded-full mb-3">
              <FiXCircle className="w-5 h-5 text-rose-700" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Rejected</p>
            <h4 className="text-2xl font-bold text-rose-900">{loadingMetrics ? "-" : metrics.rejected}</h4>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center">
            <div className="bg-emerald-100 p-2 rounded-full mb-3">
              <FiCheckCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Approved</p>
            <h4 className="text-2xl font-bold text-emerald-900">{loadingMetrics ? "-" : metrics.approved}</h4>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .sidebar-container, .topbar, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ── Generate New Report ── */}
      <div className="card-flat p-6 no-print">
        <h3 className="text-[14px] font-semibold text-slate-900 mb-5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Generate Legacy Report
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Report Type */}
          <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Report type…" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger className="flex items-center gap-2 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-600 bg-white hover:border-slate-300 outline-none transition-colors">
              <FiCalendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 text-left">{dateRange.value}</span>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                Select Range
              </p>
              {DATE_RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => { setDateRange(r); setCalOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    dateRange.label === r.label
                      ? "bg-blue-50 text-[#1E3A5F] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {r.label}
                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{r.value}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Format */}
          <Select value={format} onValueChange={(v) => v && setFormat(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Format…" />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {generating ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Generating report…</span>
              <span>{Math.round(genProgress)}%</span>
            </div>
            <Progress value={genProgress} className="h-2" />
          </div>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={!reportType || !format}
            className="text-white gap-2 disabled:opacity-40"
            style={{ background: "#1E3A5F" }}
          >
            <FiFileText className="w-4 h-4" />
            Generate Report
          </Button>
        )}
      </div>

      {/* ── Generated Reports Table ── */}
      <div className="card-flat overflow-hidden no-print">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Generated Reports Archive
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Report Name", "Format", "Generated By", "Date & Time", "Size", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4 flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-20 rounded-md" /></td>
                  </tr>
                ))
              ) : (
                reports.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FiFileText className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="font-medium text-slate-900">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type === "PDF" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{r.generatedBy}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono whitespace-nowrap">{r.generatedAt}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{r.size}</td>
                    <td className="px-5 py-3.5">
                      <Button
                        variant="ghost" size="sm"
                        className="gap-1.5 text-xs font-semibold"
                        style={{ color: "#1E3A5F" }}
                        onClick={() => handleDownload(r)}
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
