"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUploadCloud, FiDownload, FiFile, FiX, FiCheckCircle, FiAlertCircle, FiFileText, FiRefreshCw, FiUserPlus, FiUsers
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { uploadBulkCasesApi, getBatchStatusApi, getAgentsApi, assignBulkCasesApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function downloadBlob(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Upload Page ────────────────────────────────────────────────────────── */

export default function UploadPage() {
  const router = useRouter();
  const [state, setState]     = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]       = useState<File | null>(null);
  const [results, setResults] = useState<ParsedRow[]>([]);
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

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch agents in case they decide to assign
    getAgentsApi().then((res) => {
      const activeAgents = res.data.data.filter((a: any) => a.status === 'Active');
      setAgents(activeAgents);
    }).catch(() => {});
  }, []);

  async function processFile(f: File) {
    setFile(f);
    setState("uploading");
    setProgress(20);
    
    try {
      const data = await f.arrayBuffer();
      setProgress(40);
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = sheetRows[0] || [];

      const requiredHeaders = ['Customer Name', 'Phone Number', 'Address', 'Loan Amount', 'Loan Type', 'Case Type'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast.error(`Not in the required format! Missing columns: ${missingHeaders.join(", ")}`);
        setState("idle");
        setFile(null);
        return;
      }

      setProgress(60);
      setState("validating");
      
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);
      const parsed: ParsedRow[] = json.map((r: any, index: number) => {
        const name = r['Customer Name'] || '';
        const phone = r['Phone Number'] || '';
        const address = r['Address'] || '';
        const loanAmount = r['Loan Amount'] || '';
        const loanType = r['Loan Type'] || '';
        const type = r['Case Type'] || 'RESIDENTIAL';
        
        let status: "valid" | "error" = "valid";
        let error = null;

        if (!name) { status = "error"; error = "Missing customer name"; }
        else if (!phone) { status = "error"; error = "Missing phone number"; }
        else if (!address) { status = "error"; error = "Missing address"; }
        
        return { row: index + 2, name, phone, address, loanAmount, loanType, type, status, error };
      });

      setTimeout(() => {
        setResults(parsed);
        setProgress(100);
        setState("done");
        toast.success("Excel format matches successfully! Ready to import.");
      }, 500);

    } catch (error) {
      toast.error("Failed to parse the file. Please ensure it's a valid Excel (.xlsx) file.");
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
    const validRows = results.filter(r => r.status === "valid");
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    setState("processing");
    setProgress(0);

    try {
      const res = await uploadBulkCasesApi(file!.name, validRows);
      const bId = res.data.batchId;
      setBatchId(bId);
      
      toast.success("Successfully uploaded! Beginning background processing...");

      const interval = setInterval(async () => {
        try {
          const statusRes = await getBatchStatusApi(bId);
          const data = statusRes.data.data;
          setBatchProgress(data);

          const pct = data.totalRows > 0 ? (data.processedRows / data.totalRows) * 100 : 100;
          setProgress(pct);

          if (data.status === "COMPLETED" || data.status === "FAILED") {
            clearInterval(interval);
            toast.success(data.message || "Background Import Complete!");
            if (data.status === "COMPLETED" && data.caseIds?.length > 0) {
               setState("assigning");
            } else {
               setState("idle");
               setFile(null);
               setResults([]);
            }
          }
        } catch (err) {
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
      toast.error("Please select an agent first.");
      return;
    }
    if (!batchProgress?.caseIds || batchProgress.caseIds.length === 0) {
      toast.error("No valid cases to assign.");
      return;
    }

    setAssigning(true);
    try {
      await assignBulkCasesApi(batchProgress.caseIds, selectedAgentId);
      toast.success("Successfully assigned all cases to agent!");
      router.push("/app/cases");
    } catch (err: any) {
      toast.error("Failed to bulk assign cases.");
    } finally {
      setAssigning(false);
    }
  };

  const validCount = results.filter((r) => r.status === "valid").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel Upload"
        description="Upload a customer Excel file to bulk create verification cases."
        action={
          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet([{
                "Customer Name": "John Doe",
                "Phone Number": "9876543210",
                "Address": "123 Main St, Bangalore",
                "Loan Amount": 50000,
                "Loan Type": "Personal",
                "Case Type": "RESIDENTIAL"
              }]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
              XLSX.writeFile(wb, "sample_leads.xlsx");
            }}
          >
            <FiDownload className="w-4 h-4" />
            Sample Excel Template (.xlsx)
          </Button>
        }
      />

      {state === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "card-flat flex flex-col items-center justify-center gap-4 py-16 cursor-pointer transition-colors duration-200 border-2 border-dashed",
            dragOver
              ? "border-[#1E3A5F] bg-blue-50"
              : "border-border hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FiUploadCloud className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drag and drop your Excel/CSV file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse · .xlsx format required
            </p>
          </div>
          <Button className="text-white gap-2" style={{ background: "#1E3A5F" }}>
            <FiFile className="w-4 h-4" />
            Select Excel File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {(state === "uploading" || state === "validating") && (
        <div className="card-flat p-8 flex flex-col items-center gap-5">
          <div className="flex items-center gap-3 w-full max-w-sm bg-slate-50 border border-border rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FiFileText className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{file?.name}</p>
              <p className="text-xs text-slate-400">{file ? (file.size / 1024).toFixed(1) + " KB" : ""}</p>
            </div>
          </div>
          <div className="w-full max-w-sm text-center">
            <p className="text-xs text-slate-400 mb-3">
              {state === "uploading" ? "System Uploading File..." : "Validating columns & structure..."}
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-400 mt-2">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {state === "processing" && (
        <div className="card-flat p-8 flex flex-col items-center gap-5 bg-blue-50/20 border-blue-200 border">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center animate-spin">
            <FiRefreshCw className="w-6 h-6 text-[#1E3A5F]" />
          </div>
          <div className="w-full max-w-md text-center space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Background Data Import Active</h3>
              <p className="text-xs text-slate-400 mt-1">
                {batchProgress?.message || "Validating and importing customer profiles..."}
              </p>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between text-xs text-slate-400 px-1">
              <span>Processed: {batchProgress?.processedRows || 0} / {batchProgress?.totalRows || 0}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>

            <div className="flex gap-4 justify-center pt-2">
              <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-3 py-1 rounded-full">
                Valid: {batchProgress?.validRows || 0}
              </span>
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1 rounded-full">
                Errors: {batchProgress?.errorRows || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {state === "done" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 card-flat px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FiFileText className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{file?.name}</p>
              <p className="text-xs text-slate-400">{file ? (file.size / 1024).toFixed(1) + " KB · Uploaded successfully" : ""}</p>
            </div>
            <Button
              variant="ghost" size="sm"
              className="text-xs text-slate-400 gap-1.5"
              onClick={() => { setState("idle"); setFile(null); setResults([]); }}
            >
              <FiX className="w-3.5 h-3.5" /> Remove
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card-flat p-5 text-center">
              <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {results.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total Rows</p>
            </div>
            <div className="card-flat p-5 text-center">
              <p className="text-2xl font-bold text-teal-600" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {validCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Valid Rows</p>
            </div>
            <div className="card-flat p-5 text-center">
              <p className="text-2xl font-bold text-rose-600" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {errorCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Error Rows</p>
            </div>
          </div>

          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  Validation Results
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{file?.name}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const errorRows = results.filter(r => r.status === "error");
                    const csvContent = "Row,Name,Phone,Address,Error\n" + errorRows.map(r => `${r.row},"${r.name}","${r.phone}","${r.address}","${r.error}"`).join("\n");
                    downloadBlob(csvContent, "lvms_error_report.csv", "text/csv");
                    toast.success("Error report downloaded");
                  }}
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Download Error Report
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs text-white"
                  style={{ background: "#1E3A5F" }}
                  onClick={handleConfirmImport}
                  disabled={validCount === 0}
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Confirm Import ({validCount} rows)
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50">
                    {["Row", "Name", "Phone", "Address", "Loan Amount", "Case Type", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r) => (
                    <tr key={r.row} className={cn(r.status === "error" && "bg-rose-50/40")}>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{r.row}</td>
                      <td className="px-5 py-3 text-slate-900">{r.name || <span className="text-rose-500 italic">Missing</span>}</td>
                      <td className="px-5 py-3 text-slate-600">{r.phone || <span className="text-rose-500 italic">Missing</span>}</td>
                      <td className="px-5 py-3 text-slate-600 truncate max-w-[200px]" title={r.address}>{r.address || <span className="text-rose-500 italic">Missing</span>}</td>
                      <td className="px-5 py-3 text-slate-600">{r.loanAmount || "—"}</td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{r.type}</td>
                      <td className="px-5 py-3">
                        {r.status === "valid" ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full w-fit">
                            <FiCheckCircle className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full w-fit">
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

      {/* Assignment State */}
      {state === "assigning" && (
        <div className="card-flat p-8 flex flex-col items-center gap-6 bg-white border border-green-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <FiCheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">Cases Created Successfully!</h3>
            <p className="text-sm text-slate-500 mt-2">
              {batchProgress?.validRows} new verification cases have been imported. What would you like to do next?
            </p>
          </div>

          <div className="w-full max-w-lg mt-4 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <FiUsers className="w-5 h-5 text-blue-600" />
                Assign all {batchProgress?.validRows} cases to one agent
              </div>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.branch || 'No branch'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleBulkAssign} disabled={assigning || !selectedAgentId} className="w-full bg-[#1E3A5F] text-white">
                {assigning ? "Assigning..." : "Assign Bulk to Agent"}
              </Button>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">or</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <Button variant="outline" className="w-full gap-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50" onClick={() => router.push("/app/cases")}>
              <FiUserPlus className="w-4 h-4" />
              View Cases & Assign Individually
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
