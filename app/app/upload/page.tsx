"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiUploadCloud,
  FiDownload,
  FiFile,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiRefreshCw,
  FiUserPlus,
  FiUsers,
  FiLayers,
  FiDatabase,
  FiClock,
  FiCheck,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  uploadBulkCasesApi,
  getBatchStatusApi,
  getAgentsApi,
  assignBulkCasesApi,
  getUploadBatchesApi,
} from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VERIFICATION_PROFILES } from "@/lib/verificationProfiles";

type UploadState = "idle" | "uploading" | "validating" | "processing" | "done" | "assigning";

type ParsedRow = {
  row: number;
  name: string;
  phone: string;
  address: string;
  loanAmount: string;
  loanType: string;
  type: string;
  status: "valid" | "error";
  error: string | null;
};

interface BatchHistoryItem {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: string;
  createdBy: string;
  createdAt: string;
}

function downloadBlob(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatInr(val: number | string) {
  const num = typeof val === "string" ? Number(val) : val;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ParsedRow[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "valid" | "error">("all");
  const [previewSearch, setPreviewSearch] = useState("");

  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{
    processedRows: number;
    totalRows: number;
    validRows: number;
    errorRows: number;
    status: string;
    message: string;
    caseIds?: string[];
  } | null>(null);

  const [batchesHistory, setBatchesHistory] = useState<BatchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadBatches = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await getUploadBatchesApi();
      setBatchesHistory(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    getAgentsApi()
      .then((res) => {
        const activeAgents = (res.data.data || []).filter((a: any) => a.status === "Active");
        setAgents(activeAgents);
      })
      .catch(() => {});

    loadBatches();
  }, [loadBatches]);

  async function processFile(f: File) {
    setFile(f);
    setState("uploading");
    setProgress(20);

    try {
      const data = await f.arrayBuffer();
      setProgress(45);
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = (sheetRows[0] || []).map((h: any) => String(h || "").trim());

      const requiredHeaders = ["Customer Name", "Phone Number", "Address", "Loan Amount", "Loan Type", "Case Type"];
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast.error(`Invalid template structure. Missing required columns: ${missingHeaders.join(", ")}`);
        setState("idle");
        setFile(null);
        return;
      }

      setProgress(75);
      setState("validating");

      const json: any[] = XLSX.utils.sheet_to_json(worksheet);
      const parsed: ParsedRow[] = json.map((r: any, index: number) => {
        const name = String(r["Customer Name"] || "").trim();
        const phone = String(r["Phone Number"] || "").trim();
        const address = String(r["Address"] || "").trim();
        const loanAmount = String(r["Loan Amount"] || "").trim();
        const loanType = String(r["Loan Type"] || "General Loan").trim();
        const type = String(r["Case Type"] || "RESIDENTIAL").trim().toUpperCase();

        let status: "valid" | "error" = "valid";
        let error: string | null = null;

        if (!name) {
          status = "error";
          error = "Missing customer name";
        } else if (!phone) {
          status = "error";
          error = "Missing phone number";
        } else if (!address) {
          status = "error";
          error = "Missing property / site address";
        }

        return { row: index + 2, name, phone, address, loanAmount, loanType, type, status, error };
      });

      setTimeout(() => {
        setResults(parsed);
        setProgress(100);
        setState("done");
        toast.success(`Validated ${parsed.length} rows successfully! Ready to import.`);
      }, 400);
    } catch {
      toast.error("Failed to parse the file. Please ensure it is a valid .xlsx spreadsheet.");
      setState("idle");
      setFile(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }

  async function handleConfirmImport() {
    const validRows = results.filter((r) => r.status === "valid");
    if (validRows.length === 0) {
      toast.error("No valid rows available to import.");
      return;
    }

    setState("processing");
    setProgress(0);

    try {
      const res = await uploadBulkCasesApi(file!.name, validRows as any);
      const bId = res.data.batchId;
      setBatchId(bId);

      toast.success("Batch uploaded! Running parallel geocoding & database ingestion...");

      const interval = setInterval(async () => {
        try {
          const statusRes = await getBatchStatusApi(bId);
          const data = statusRes.data.data;
          setBatchProgress(data);

          const pct = data.totalRows > 0 ? (data.processedRows / data.totalRows) * 100 : 100;
          setProgress(pct);

          if (data.status === "COMPLETED" || data.status === "FAILED") {
            clearInterval(interval);
            loadBatches();
            toast.success(data.message || "Background Import Complete!");
            if (data.status === "COMPLETED" && data.caseIds?.length > 0) {
              setState("assigning");
            } else {
              setState("idle");
              setFile(null);
              setResults([]);
            }
          }
        } catch {
          clearInterval(interval);
          toast.error("Failed to fetch background progress updates.");
          setState("idle");
        }
      }, 700);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start bulk import.");
      setState("done");
    }
  }

  const handleBulkAssign = async () => {
    if (!selectedAgentId) {
      toast.error("Please select a field agent first.");
      return;
    }
    if (!batchProgress?.caseIds || batchProgress.caseIds.length === 0) {
      toast.error("No valid cases to assign.");
      return;
    }

    setAssigning(true);
    try {
      const res = await assignBulkCasesApi(batchProgress.caseIds, selectedAgentId);
      toast.success(res.data.message || "Successfully assigned all cases to agent!");
      router.push("/app/cases");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to bulk assign cases.");
    } finally {
      setAssigning(false);
    }
  };

  const validCount = results.filter((r) => r.status === "valid").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  const filteredResults = results.filter((r) => {
    if (activeTabFilter === "valid" && r.status !== "valid") return false;
    if (activeTabFilter === "error" && r.status !== "error") return false;
    if (previewSearch) {
      const s = previewSearch.toLowerCase();
      return (
        r.name.toLowerCase().includes(s) ||
        r.phone.toLowerCase().includes(s) ||
        r.address.toLowerCase().includes(s) ||
        r.type.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const downloadSampleTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Customer Name": "Elaiyaraja P",
        "Phone Number": "9840123451",
        "Address": "No 14, 2nd Cross Street, Gandhi Nagar, Adyar, Chennai - 600020",
        "Loan Amount": 450000,
        "Loan Type": "Personal Loan",
        "Case Type": "RESIDENTIAL",
      },
      {
        "Customer Name": "Veeramanikandan S",
        "Phone Number": "9840123452",
        "Address": "Shop No 5, Main Bazaar Road, T Nagar, Chennai - 600017",
        "Loan Amount": 1200000,
        "Loan Type": "Business Loan",
        "Case Type": "BUSINESS",
      },
      {
        "Customer Name": "Saravanan M",
        "Phone Number": "9840123453",
        "Address": "Old Door 12, New 28, Pillaiyar Kovil Street, Velachery, Chennai - 600042",
        "Loan Amount": 850000,
        "Loan Type": "Commercial Loan",
        "Case Type": "RESI_CUM_BUSINESS",
      },
      {
        "Customer Name": "Mohan Kuzhandaivel",
        "Phone Number": "9840123454",
        "Address": "Plot 45, SIPCOT IT Park, Siruseri, OMR, Chennai - 603103",
        "Loan Amount": 600000,
        "Loan Type": "Personal Loan",
        "Case Type": "OFFICE_PAYSLIP",
      },
      {
        "Customer Name": "Murugesan K",
        "Phone Number": "9840123455",
        "Address": "SF No 142/2, Melur Village, Madurai Road, Trichy - 620001",
        "Loan Amount": 500000,
        "Loan Type": "Agri Loan",
        "Case Type": "AGRICULTURE",
      },
      {
        "Customer Name": "Sri Kanth Arjunan",
        "Phone Number": "9840123456",
        "Address": "No 88, GST Road, Chromepet, Chennai - 600044",
        "Loan Amount": 2500000,
        "Loan Type": "Two Wheeler Dealer",
        "Case Type": "DEALERS",
      },
      {
        "Customer Name": "Vasanth Kumar R",
        "Phone Number": "9840123457",
        "Address": "Flat 3B, Green Park Apartments, Anna Nagar West, Chennai - 600040",
        "Loan Amount": 750000,
        "Loan Type": "Home Loan",
        "Case Type": "DSA_RESIDENTIAL",
      },
      {
        "Customer Name": "Senthil Nathan B",
        "Phone Number": "9840123458",
        "Address": "2nd Floor, Above Apollo Pharmacy, 100 Feet Road, Vadapalani, Chennai - 600026",
        "Loan Amount": 1500000,
        "Loan Type": "DSA Multi-Product",
        "Case Type": "DSA_BUSINESS",
      },
      {
        "Customer Name": "Balaji T",
        "Phone Number": "9840123459",
        "Address": "Door 9, 3rd Street, Rajaji Nagar, Tambaram, Chennai - 600045",
        "Loan Amount": 900000,
        "Loan Type": "DSA Loan",
        "Case Type": "DSA_RESI_CUM_BUSINESS",
      },
      {
        "Customer Name": "K Ganapathi",
        "Phone Number": "9840123460",
        "Address": "Door 54, Sivan Kovil Street, Palayamkottai, Tirunelveli - 627002",
        "Loan Amount": 45000,
        "Loan Type": "Asset Loan",
        "Case Type": "LOAN_ASSET_VERIFICATION",
      },
      {
        "Customer Name": "Prabhakhar D",
        "Phone Number": "9840123461",
        "Address": "1/19, V.V. Kovil Street, Chinmaya Nagar, Koyambedu, Chennai - 600092",
        "Loan Amount": 3000000,
        "Loan Type": "LAP / Property Loan",
        "Case Type": "PROPERTY",
      },
      {
        "Customer Name": "Rajendran V",
        "Phone Number": "9840123462",
        "Address": "Plot 108, Greenfields Layout, Bypass Road, Coimbatore - 641001",
        "Loan Amount": 4500000,
        "Loan Type": "Property Purchase",
        "Case Type": "SELLER",
      },
    ]);
    ws["!cols"] = [
      { wch: 24 },
      { wch: 16 },
      { wch: 65 },
      { wch: 14 },
      { wch: 22 },
      { wch: 28 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "12_Verification_Profiles");
    XLSX.writeFile(wb, "sample_12_cases_loan_verification.xlsx");
    toast.success("Standard 12-Profile template downloaded! 📊");
  };

  const totalBatchesCount = batchesHistory.length;
  const totalRowsUploaded = batchesHistory.reduce((acc, b) => acc + (b.totalRows || 0), 0);
  const totalValidRows = batchesHistory.reduce((acc, b) => acc + (b.validRows || 0), 0);
  const overallSuccessRate =
    totalRowsUploaded > 0 ? Math.round((totalValidRows / totalRowsUploaded) * 100) : 100;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Banner */}
      <PageHeader
        title="Excel Bulk Upload & Intake Queue"
        description="Ingest customer verification files in bulk, auto-extract GPS coordinates with parallel geocoding, and assign cases to field agents."
        action={
          <Button
            variant="outline"
            className="gap-2 text-sm bg-white hover:bg-slate-50 border-slate-300 shadow-sm"
            onClick={downloadSampleTemplate}
          >
            <FiDownload className="w-4 h-4 text-blue-600" />
            Download Excel Template (.xlsx)
          </Button>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Batches</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FiLayers size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalBatchesCount}</div>
          <p className="text-xs text-slate-400 mt-1">Uploaded spreadsheets</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processed Records</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FiDatabase size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalRowsUploaded}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">{totalValidRows} valid cases created</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">{overallSuccessRate}%</div>
          <p className="text-xs text-slate-400 mt-1">Template validation accuracy</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Field Agents</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FiUsers size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{agents.length}</div>
          <p className="text-xs text-slate-400 mt-1">Ready for auto-assignment</p>
        </div>
      </div>

      {/* Upload Box / States */}
      {state === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative overflow-hidden rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed bg-gradient-to-b from-white to-slate-50/50 shadow-sm group",
            dragOver
              ? "border-[#1E3A5F] bg-blue-50/60 scale-[1.01]"
              : "border-slate-300 hover:border-blue-500 hover:bg-blue-50/20"
          )}
        >
          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1E3A5F] to-[#2B6CB0] flex items-center justify-center shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform">
              <FiUploadCloud className="w-10 h-10 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Drag & drop your Excel or CSV file here
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and standard CSV files up to 25MB.
              </p>
            </div>

            {/* Quick Profile Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Auto-Detects 12 Profiles:</span>
              {["Residential", "Business", "Resi cum Business", "Property", "Seller", "Office", "Dealers", "DSA"].map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200"
                >
                  {p}
                </span>
              ))}
            </div>

            <Button
              className="mt-2 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md gap-2"
              style={{ background: "#1E3A5F" }}
            >
              <FiFile className="w-4 h-4" />
              Browse Excel Files
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {(state === "uploading" || state === "validating") && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-sm">
          <div className="flex items-center gap-4 w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <FiFileText className="w-6 h-6 text-[#1E3A5F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{file?.name}</p>
              <p className="text-xs text-slate-500 font-medium">
                {file ? (file.size / 1024).toFixed(1) + " KB" : ""} · Ready for processing
              </p>
            </div>
          </div>
          <div className="w-full max-w-md text-center">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {state === "uploading"
                ? "Reading spreadsheet structure..."
                : "Validating headers across 12 verification profile schemas..."}
            </p>
            <Progress value={progress} className="h-2.5 rounded-full" />
            <p className="text-xs text-slate-400 mt-2 font-mono">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {state === "processing" && (
        <div className="bg-gradient-to-b from-blue-50/50 to-white border border-blue-200 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#1E3A5F] flex items-center justify-center text-white shadow-lg shadow-blue-900/15">
            <FiRefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div className="w-full max-w-lg text-center space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A5F] text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Parallel Geocoding & High-Speed Ingestion Active
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Processing {batchProgress?.totalRows || results.length} Customer Records
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {batchProgress?.message || "Extracting addresses, resolving GPS coordinates, and creating cases..."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Progress value={progress} className="h-3 rounded-full bg-slate-100" />
              <div className="flex justify-between text-xs text-slate-500 font-semibold px-1">
                <span>
                  Processed: {batchProgress?.processedRows || 0} / {batchProgress?.totalRows || results.length} rows
                </span>
                <span className="text-[#1E3A5F] font-bold">{Math.round(progress)}% Complete</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2 flex-wrap">
              <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Valid Cases: {batchProgress?.validRows || 0}
              </div>
              <div className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">
                ⚡ Parallel Worker: 10 concurrent tasks
              </div>
              {batchProgress?.errorRows ? (
                <div className="text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FiAlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Errors: {batchProgress.errorRows}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Done State: Data Grid Preview */}
      {state === "done" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FiFileText className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 truncate">{file?.name}</p>
                <p className="text-xs text-slate-400">
                  {file ? (file.size / 1024).toFixed(1) + " KB" : ""} · Ready for database intake
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-rose-600 gap-1.5"
              onClick={() => {
                setState("idle");
                setFile(null);
                setResults([]);
              }}
            >
              <FiX className="w-4 h-4" /> Cancel & Pick Another
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900">{results.length}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Total Rows</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-emerald-600">{validCount}</p>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-1">Valid Rows</p>
            </div>
            <div className="bg-white border border-rose-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-rose-600">{errorCount}</p>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mt-1">Error Rows</p>
            </div>
          </div>

          {/* Validation Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-wrap gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      activeTabFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTabFilter("all")}
                  >
                    All ({results.length})
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      activeTabFilter === "valid" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"
                    }`}
                    onClick={() => setActiveTabFilter("valid")}
                  >
                    Valid ({validCount})
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      activeTabFilter === "error" ? "bg-white text-rose-700 shadow-sm" : "text-slate-500 hover:text-rose-700"
                    }`}
                    onClick={() => setActiveTabFilter("error")}
                  >
                    Errors ({errorCount})
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 w-56">
                  <FiSearch className="text-slate-400" />
                  <input
                    placeholder="Search in preview..."
                    className="outline-none bg-transparent w-full text-xs"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {errorCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      const errorRows = results.filter((r) => r.status === "error");
                      const csvContent =
                        "Row,Name,Phone,Address,Error\n" +
                        errorRows
                          .map((r) => `${r.row},"${r.name}","${r.phone}","${r.address}","${r.error}"`)
                          .join("\n");
                      downloadBlob(csvContent, "lvms_error_report.csv", "text/csv");
                      toast.success("Error report downloaded! 📑");
                    }}
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    Download Error Report
                  </Button>
                )}
                <Button
                  size="sm"
                  className="gap-1.5 text-xs text-white shadow-md font-semibold px-4"
                  style={{ background: "#1E3A5F" }}
                  onClick={handleConfirmImport}
                  disabled={validCount === 0}
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Confirm Import ({validCount} Valid Cases)
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    {["Row", "Customer Name", "Phone", "Property Address", "Loan Amount", "Case Profile", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredResults.map((r) => (
                    <tr key={r.row} className={cn(r.status === "error" ? "bg-rose-50/40" : "hover:bg-slate-50")}>
                      <td className="px-5 py-3 text-slate-400 font-mono">{r.row}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{r.name || <span className="text-rose-500 italic">Missing</span>}</td>
                      <td className="px-5 py-3 text-slate-600 font-mono">{r.phone || <span className="text-rose-500 italic">Missing</span>}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-xs truncate" title={r.address}>
                        {r.address || <span className="text-rose-500 italic">Missing</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-800 font-bold">
                        {r.loanAmount ? formatInr(r.loanAmount) : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-blue-700 bg-blue-50/50 rounded">
                        {r.type}
                      </td>
                      <td className="px-5 py-3">
                        {r.status === "valid" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            <FiCheck className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                            <FiAlertCircle className="w-3 h-3" /> {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Flow */}
      {state === "assigning" && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <FiCheckCircle className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">Cases Ingested Successfully!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              {batchProgress?.validRows} verification cases have been created with geocoded coordinates. Assign them to a field officer now or manage them in the Cases console.
            </p>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FiUsers className="text-blue-600" />
                Assign all {batchProgress?.validRows} cases to one officer:
              </label>
              <Select value={selectedAgentId} onValueChange={(v) => v && setSelectedAgentId(v)}>
                <SelectTrigger className="w-full bg-white border-slate-300">
                  <span>
                    {selectedAgentId
                      ? agents.find((a) => a.id === selectedAgentId)?.name || selectedAgentId
                      : "Select an active agent..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.branch || "General Branch"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleBulkAssign}
                disabled={assigning || !selectedAgentId}
                className="w-full text-white font-semibold shadow-md"
                style={{ background: "#1E3A5F" }}
              >
                {assigning ? "Assigning Cases..." : "Assign Bulk to Agent"}
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 border-slate-300 text-slate-700 font-semibold"
              onClick={() => router.push("/app/cases")}
            >
              <FiUserPlus className="w-4 h-4" />
              Manage & Assign Cases Individually
            </Button>
          </div>
        </div>
      )}

      {/* Historical Upload Batches Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FiClock className="text-slate-400" /> Recent Upload Batches & Intake Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live record of all spreadsheet uploads and background worker execution
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadBatches}
            className="text-xs gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <FiRefreshCw className={cn("w-3.5 h-3.5", historyLoading && "animate-spin")} />
            Refresh Log
          </Button>
        </div>

        {batchesHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <FiLayers size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No spreadsheet batches uploaded yet</p>
            <p className="text-slate-400 mt-1">Uploaded files will be tracked here with total valid rows and status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">File Name</th>
                  <th className="px-6 py-3">Total Records</th>
                  <th className="px-6 py-3">Valid Cases</th>
                  <th className="px-6 py-3">Error Rows</th>
                  <th className="px-6 py-3">Uploaded By</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Batch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchesHistory.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <FiFileText className="text-blue-600" />
                      {b.fileName}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">{b.totalRows}</td>
                    <td className="px-6 py-3.5 font-bold text-emerald-600">{b.validRows}</td>
                    <td className="px-6 py-3.5 font-bold text-rose-600">{b.errorRows}</td>
                    <td className="px-6 py-3.5 text-slate-600">{b.createdBy || "Admin"}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(b.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1",
                          b.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-800 animate-pulse"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {b.status === "COMPLETED" ? (
                          <FiCheck className="w-3 h-3" />
                        ) : (
                          <FiClock className="w-3 h-3" />
                        )}
                        {b.status}
                      </span>
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
