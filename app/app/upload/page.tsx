"use client";

import { useState, useRef } from "react";
import {
  FiUploadCloud, FiDownload, FiFile, FiX, FiCheckCircle, FiAlertCircle, FiFileText,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Papa from "papaparse";
import { uploadBulkCasesApi } from "@/lib/api";

type UploadState = "idle" | "uploading" | "validating" | "done";

type ParsedRow = {
  row: number;
  name: string;
  phone: string;
  address: string;
  loanAmount: string;
  loanType: string;
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
  const [state, setState]     = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]       = useState<File | null>(null);
  const [results, setResults] = useState<ParsedRow[]>([]);
  const inputRef              = useRef<HTMLInputElement>(null);

  function processFile(f: File) {
    setFile(f);
    setState("uploading");
    setProgress(25);
    
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setProgress(75);
        setState("validating");
        
        const parsed: ParsedRow[] = result.data.map((r: any, index) => {
          const name = r['Customer Name'] || r['Name'] || '';
          const phone = r['Phone'] || r['Phone Number'] || '';
          const address = r['Address'] || '';
          const loanAmount = r['Loan Amount'] || '';
          const loanType = r['Loan Type'] || '';
          
          let status: "valid" | "error" = "valid";
          let error = null;

          if (!name) { status = "error"; error = "Missing customer name"; }
          else if (!phone) { status = "error"; error = "Missing phone number"; }
          else if (!address) { status = "error"; error = "Missing address"; }
          
          return { row: index + 2, name, phone, address, loanAmount, loanType, status, error };
        });

        setTimeout(() => {
          setResults(parsed);
          setProgress(100);
          setState("done");
        }, 800);
      },
      error: () => {
        toast.error("Failed to parse the file. Please ensure it's a valid CSV.");
        setState("idle");
        setFile(null);
      }
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = ""; // reset so same file can be re-selected
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

    try {
      const res = await uploadBulkCasesApi(validRows);
      toast.success(res.data.message || `${validRows.length} valid rows imported successfully!`);
      setState("idle");
      setFile(null);
      setResults([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to import data.");
    }
  }

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
              const link = document.createElement("a");
              link.href = "/sample_leads.csv";
              link.download = "sample_leads.csv";
              link.click();
            }}
          >
            <FiDownload className="w-4 h-4" />
            Download Sample CSV
          </Button>
        }
      />

      {/* Drop Zone — shown when idle */}
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
              or click to browse · .csv accepted · Max 10 MB
            </p>
          </div>
          <Button className="text-white gap-2" style={{ background: "#1E3A5F" }}>
            <FiUploadCloud className="w-4 h-4" />
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Progress */}
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
              {state === "uploading" ? "Uploading…" : "Validating rows…"}
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-400 mt-2">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {/* Results */}
      {state === "done" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 card-flat px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FiFileText className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{file?.name}</p>
              <p className="text-xs text-slate-400">{file ? (file.size / 1024).toFixed(1) + " KB · Uploaded just now" : ""}</p>
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
                    {["Row", "Name", "Phone", "Address", "Status"].map((h) => (
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
                      <td className="px-5 py-3 text-slate-600">{r.address || <span className="text-rose-500 italic">Missing</span>}</td>
                      <td className="px-5 py-3">
                        {r.status === "valid" ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium badge-completed px-2.5 py-0.5 rounded-full w-fit">
                            <FiCheckCircle className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium badge-rejected px-2.5 py-0.5 rounded-full w-fit">
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
    </div>
  );
}
