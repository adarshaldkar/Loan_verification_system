"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiDownload,
  FiFileText,
  FiCalendar,
  FiPrinter,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiTrendingUp,
  FiRefreshCw,
  FiLayers,
  FiShield,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  getReportsApi,
  generateReportApi,
  getReportMetricsApi,
  exportRcuBatchPdfApi,
  getCasesApi,
} from "@/lib/api";

const getDynamicDateRanges = () => {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return [
    { label: "Today", value: fmt(now) },
    {
      label: "Last 7 days",
      value: `${fmt(new Date(now.getTime() - 7 * 86400000))} – ${fmt(now)}`,
    },
    {
      label: "This Month",
      value: `${fmt(new Date(now.getFullYear(), now.getMonth(), 1))} – ${fmt(now)}`,
    },
    { label: "All Time", value: "All Available Audits" },
  ];
};

const REPORT_TYPES = [
  { value: "weekly", label: "Consolidated Verification Audit Summary" },
  { value: "agent", label: "Field Agent Operations & Productivity" },
  { value: "branch", label: "Regional Branch Audit & SLA Report" },
  { value: "audit", label: "Executive Risk & Compliance Trail" },
];

const FORMATS = [
  { value: "pdf", label: "Official PDF Document" },
  { value: "excel", label: "Excel Spreadsheet (.xlsx)" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [format, setFormat] = useState("");
  const [dateRange, setDateRange] = useState(getDynamicDateRanges()[0]);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingBatch, setDownloadingBatch] = useState(false);

  // Metrics State
  const [metricsTimeframe, setMetricsTimeframe] = useState("daily");
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    rejected: 0,
    approved: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getReportsApi();
      setReports(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async (timeframe: string) => {
    try {
      setLoadingMetrics(true);
      const res = await getReportMetricsApi(timeframe);
      setMetrics(res.data.data);
    } catch {
      // fallback
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchMetrics(metricsTimeframe);
  }, [fetchReports, fetchMetrics, metricsTimeframe]);

  const handleTimeframeChange = (val: string) => {
    setMetricsTimeframe(val);
    fetchMetrics(val);
  };

  function handleGenerate() {
    if (!reportType || !format) {
      toast.error("Please select both a report type and export format.");
      return;
    }
    setGenerating(true);
    setGenProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 25 + 15;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);

        generateReportApi({ reportType, format, dateRange: dateRange.value })
          .then(() => {
            toast.success("Audit report compiled and added to archive! 📑");
            fetchReports();
          })
          .catch(() => toast.error("Failed to compile report"))
          .finally(() => {
            setGenerating(false);
            setReportType("");
            setFormat("");
          });
      }
      setGenProgress(Math.min(p, 100));
    }, 120);
  }

  /* Direct Batch RCU PDF Export */
  async function handleExportBatchPdf() {
    setDownloadingBatch(true);
    try {
      toast.info("Compiling high-resolution Consolidated RCU Audit PDF...");
      const res = await exportRcuBatchPdfApi("Consolidated RCU Audit Report", dateRange.value);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CONSOLIDATED_RCU_AUDIT_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 1000);
      toast.success("Consolidated RCU PDF downloaded successfully! 📄");
    } catch {
      toast.error("Failed to generate Consolidated RCU PDF");
    } finally {
      setDownloadingBatch(false);
    }
  }

  async function handleDownloadArchiveItem(r: any) {
    if (r.type === "PDF" || r.format === "pdf") {
      try {
        toast.info(`Generating official RCU PDF for ${r.name}...`);
        const res = await exportRcuBatchPdfApi(r.name, r.dateRange || "All Time");
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safeName = (r.name || "Audit_Report").replace(/[^a-zA-Z0-9_]/g, "_");
        a.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 1000);
        toast.success(`Downloaded ${r.name} as official PDF! 📄`);
      } catch {
        toast.error("Failed to generate PDF report");
      }
    } else {
      try {
        toast.info(`Extracting live database records for ${r.name}...`);
        const casesRes = await getCasesApi("All");
        const liveCases = casesRes.data.data || [];

        const completedCount = liveCases.filter((c: any) => c.status === "COMPLETED").length;
        const approvedCount = liveCases.filter((c: any) => c.status === "APPROVED").length;
        const pendingCount = liveCases.filter(
          (c: any) => c.status === "PENDING" || c.status === "IN_PROGRESS"
        ).length;
        const rejectedCount = liveCases.filter((c: any) => c.status === "REJECTED").length;

        const dataRows: any[][] = [
          ["REPORT NAME", r.name],
          ["EXPORT TYPE", "Microsoft Excel Spreadsheet (.xlsx)"],
          ["GENERATED BY", r.generatedBy || "Skyline Risk Control Unit"],
          ["GENERATED AT", new Date().toLocaleString("en-IN")],
          ["DATE RANGE", r.dateRange || "All Recorded Cases"],
          [],
          ["--- EXECUTIVE SUMMARY ---"],
          ["Total Database Cases", liveCases.length],
          ["Approved Verifications", approvedCount],
          ["Completed Field Inspections", completedCount],
          ["Pending / In Progress", pendingCount],
          ["Rejected / Needs Revision", rejectedCount],
          [],
          ["--- VERIFICATION CASES AUDIT LOG ---"],
          [
            "Application ID",
            "Customer Name",
            "Profile Code",
            "Case Status",
            "Assigned Field Officer",
            "Regional Hub",
            "Loan Amount (INR)",
            "Date Created",
          ],
          ...liveCases.map((c: any) => [
            c.applicationId || c.id.slice(0, 8),
            c.customer,
            c.type,
            c.status,
            c.agent || "Unassigned",
            c.branch || "General",
            c.loanAmount || 0,
            c.submittedAt || "—",
          ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(dataRows);
        ws["!cols"] = [
          { wch: 20 },
          { wch: 25 },
          { wch: 25 },
          { wch: 18 },
          { wch: 24 },
          { wch: 20 },
          { wch: 18 },
          { wch: 22 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RCU_Audit_Report");
        XLSX.writeFile(
          wb,
          `${r.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
        toast.success(`Downloaded ${r.name} as Excel! 📊`);
      } catch {
        toast.error("Failed to generate Excel report");
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Audit & Performance Reports"
          description="Generate bank-grade RCU audit summaries, field agent metrics, and official compliance PDF archives."
        />
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleExportBatchPdf}
            disabled={downloadingBatch}
            className="gap-2 text-white font-semibold shadow-md"
            style={{ background: "#1E3A5F" }}
          >
            <FiDownload className={downloadingBatch ? "animate-bounce" : "w-4 h-4"} />
            {downloadingBatch ? "Generating PDF..." : "Export Consolidated RCU PDF"}
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="gap-2 shrink-0">
            <FiPrinter className="w-4 h-4 text-slate-500" />
            Print View
          </Button>
        </div>
      </div>

      {/* ── Dynamic Metrics Overview ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-blue-600" />
              Live Verification Metrics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated across all 12 profile questionnaires and field inspections
            </p>
          </div>
          <Select value={metricsTimeframe} onValueChange={(val) => val && handleTimeframeChange(val)}>
            <SelectTrigger className="w-44 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily (Last 24 Hours)</SelectItem>
              <SelectItem value="weekly">Weekly (Last 7 Days)</SelectItem>
              <SelectItem value="monthly">Monthly (Last 30 Days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-center items-center text-center">
            <div className="bg-blue-100 p-2.5 rounded-2xl mb-2 text-[#1E3A5F]">
              <FiCheckCircle size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Completed Data
            </p>
            <h4 className="text-2xl font-extrabold text-[#1E3A5F]">
              {loadingMetrics ? "-" : metrics.completed}
            </h4>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-center items-center text-center">
            <div className="bg-amber-100 p-2.5 rounded-2xl mb-2 text-amber-700">
              <FiClock size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              In Progress
            </p>
            <h4 className="text-2xl font-extrabold text-amber-800">
              {loadingMetrics ? "-" : metrics.inProgress}
            </h4>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-center items-center text-center">
            <div className="bg-rose-100 p-2.5 rounded-2xl mb-2 text-rose-700">
              <FiXCircle size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Rejected / Revision
            </p>
            <h4 className="text-2xl font-extrabold text-rose-800">
              {loadingMetrics ? "-" : metrics.rejected}
            </h4>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-center items-center text-center">
            <div className="bg-emerald-100 p-2.5 rounded-2xl mb-2 text-emerald-700">
              <FiShield size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Approved
            </p>
            <h4 className="text-2xl font-extrabold text-emerald-800">
              {loadingMetrics ? "-" : metrics.approved}
            </h4>
          </div>
        </div>
      </div>

      {/* ── Generate Report Form ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Compile Custom Audit Report</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select an audit scope and format to generate a consolidated report
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={reportType} onValueChange={(val) => val && setReportType(val)}>
            <SelectTrigger className="bg-slate-50 rounded-xl text-xs">
              <SelectValue placeholder="Select Report Type..." />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dateRange.label}
            onValueChange={(val) => {
              const matched = getDynamicDateRanges().find((d) => d.label === val);
              if (matched) setDateRange(matched);
            }}
          >
            <SelectTrigger className="bg-slate-50 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-slate-400" />
                <span>{dateRange.value}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {getDynamicDateRanges().map((d) => (
                <SelectItem key={d.label} value={d.label}>
                  {d.label} ({d.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={format} onValueChange={(val) => val && setFormat(val)}>
            <SelectTrigger className="bg-slate-50 rounded-xl text-xs">
              <SelectValue placeholder="Select Format (PDF / Excel)..." />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {generating && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>Compiling records & formatting tables...</span>
              <span>{Math.round(genProgress)}%</span>
            </div>
            <Progress value={genProgress} className="h-2 rounded-full" />
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="text-white text-xs font-semibold px-6 shadow-md rounded-xl"
          style={{ background: "#1E3A5F" }}
        >
          {generating ? "Compiling Report..." : "Generate & Save to Archive"}
        </Button>
      </div>

      {/* ── Generated Reports Archive ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FiLayers className="text-slate-400" /> Generated Reports Archive
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Download previously compiled executive reports and spreadsheets
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchReports}
            className="text-xs gap-1.5 text-slate-600"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading reports archive...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <FiFileText size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No compiled reports in archive</p>
            <p className="text-slate-400 mt-1">
              Select a scope above and click Generate to produce PDF and Excel reports.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Report Title</th>
                  <th className="px-6 py-3.5">Format</th>
                  <th className="px-6 py-3.5">Date Range</th>
                  <th className="px-6 py-3.5">Generated By</th>
                  <th className="px-6 py-3.5">File Size</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <FiFileText className="text-blue-600" />
                      {r.name}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.type === "PDF" || r.format === "pdf"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {r.type || r.format?.toUpperCase() || "PDF"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{r.dateRange || "All Records"}</td>
                    <td className="px-6 py-3.5 text-slate-600">{r.generatedBy || "Admin"}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono">{r.size || "1.2 MB"}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadArchiveItem(r)}
                        className="gap-1.5 text-xs text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
