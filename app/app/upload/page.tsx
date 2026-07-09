"use client";

import { useState, useRef } from "react";
import {
  FiUploadCloud, FiDownload, FiFile, FiX, FiCheckCircle, FiAlertCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

/* ─── Mock validation result ─────────────────────────────────────────────── */

const mockResults = [
  { row: 2, name: "Ravi Kumar",    phone: "+91 98765 43210", address: "12 MG Road, Bangalore", status: "valid",  error: null },
  { row: 3, name: "Sneha Patel",   phone: "+91 87654 32109", address: "45 Park St, Mumbai",    status: "valid",  error: null },
  { row: 4, name: "Ajay Sharma",   phone: "",                address: "78 Civil Lines, Delhi",  status: "error",  error: "Missing phone number" },
  { row: 5, name: "",              phone: "+91 76543 21098", address: "90 Ring Rd, Hyderabad",  status: "error",  error: "Missing customer name" },
  { row: 6, name: "Reena Singh",   phone: "+91 65432 10987", address: "23 Station Rd, Pune",   status: "valid",  error: null },
  { row: 7, name: "Mohan Reddy",   phone: "+91 54321 09876", address: "",                       status: "error",  error: "Missing address" },
  { row: 8, name: "Priti Joshi",   phone: "+91 43210 98765", address: "56 Lake View, Chennai",  status: "valid",  error: null },
];

type UploadState = "idle" | "uploading" | "validating" | "done";

/* ─── Upload Page ────────────────────────────────────────────────────────── */

export default function UploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function simulateUpload(f: File) {
    setFile(f);
    setState("uploading");
    setProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setState("validating");
        setTimeout(() => setState("done"), 1200);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) simulateUpload(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) simulateUpload(f);
  }

  const validCount = mockResults.filter((r) => r.status === "valid").length;
  const errorCount = mockResults.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel Upload"
        description="Upload a customer Excel file to bulk create verification cases."
        action={
          <Button variant="outline" className="gap-2 text-sm">
            <FiDownload className="w-4 h-4" />
            Download Template
          </Button>
        }
      />

      {/* Drop Zone */}
      {state === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "card-flat flex flex-col items-center justify-center gap-4 py-16 cursor-pointer transition-colors duration-200 border-2 border-dashed",
            dragOver
              ? "border-[--color-brand-900] bg-[--color-brand-50]"
              : "border-border hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FiUploadCloud className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drag and drop your Excel file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse · .xlsx, .xls accepted · Max 10 MB
            </p>
          </div>
          <Button className="bg-[--color-brand-900] hover:bg-[--color-brand-800] text-white gap-2">
            <FiUploadCloud className="w-4 h-4" />
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Progress */}
      {(state === "uploading" || state === "validating") && (
        <div className="card-flat p-8 flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[--color-brand-50] flex items-center justify-center">
            <FiFile className="w-7 h-7 text-[--color-brand-900]" />
          </div>
          <div className="w-full max-w-sm text-center">
            <p className="text-sm font-medium text-slate-900 mb-1">
              {file?.name}
            </p>
            <p className="text-xs text-slate-400 mb-4">
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
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card-flat p-5 text-center">
              <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                {mockResults.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total Rows</p>
            </div>
            <div className="card-flat p-5 text-center border-[--color-status-completed]/30">
              <p className="text-2xl font-bold" style={{ color: "var(--color-status-completed)", fontFamily: "var(--font-plus-jakarta)" }}>
                {validCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Valid Rows</p>
            </div>
            <div className="card-flat p-5 text-center border-[--color-status-rejected]/30">
              <p className="text-2xl font-bold" style={{ color: "var(--color-status-rejected)", fontFamily: "var(--font-plus-jakarta)" }}>
                {errorCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Error Rows</p>
            </div>
          </div>

          {/* Validation Table */}
          <div className="card-flat overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  Validation Results
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{file?.name}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FiDownload className="w-3.5 h-3.5" />
                  Download Error Report
                </Button>
                <Button size="sm" className="gap-1.5 text-xs bg-[--color-brand-900] hover:bg-[--color-brand-800] text-white">
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
                  {mockResults.map((r) => (
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

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => { setState("idle"); setFile(null); }}>
              <FiX className="w-3.5 h-3.5 mr-1" />
              Upload a different file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
