"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiSearch, FiFileText, FiDownload, FiCheckCircle, FiClock, FiFile } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getCasesApi } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type ApprovedCase = {
  id: string;
  customer: string;
  type: string;
  status: string;
  agent: string;
  branch: string;
  submittedAt: string;
};

export default function ApprovedCasesPage() {
  const [cases, setCases] = useState<ApprovedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchApproved() {
      try {
        setLoading(true);
        const res = await getCasesApi("APPROVED");
        setCases(res.data.data);
      } catch (err) {
        toast.error("Failed to load approved cases");
      } finally {
        setLoading(false);
      }
    }
    fetchApproved();
  }, []);

  const filtered = cases.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const dataToExport = filtered.map(c => ({
      "Case ID": c.id,
      "Customer Name": c.customer,
      "Case Type": c.type,
      "Agent Assigned": c.agent,
      "Branch": c.branch,
      "Verification Date": c.submittedAt
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approved_Cases");
    XLSX.writeFile(wb, "Approved_Cases_Report.xlsx");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verified & Approved"
        description="View all documents and cases that have been successfully verified and approved."
        action={
          <Button onClick={exportExcel} variant="outline" className="gap-2 bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            <FiDownload className="w-4 h-4" />
            Export Approved List
          </Button>
        }
      />

      <div className="card-flat overflow-hidden p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search approved cases by ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4" />
            {filtered.length} Approved Cases
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-5 space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              No approved cases found.
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all bg-white group">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">{c.customer}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <FiFile className="w-3.5 h-3.5" /> {c.id.slice(0, 8)}...
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    Approved
                  </span>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Case Type</span>
                    <span className="font-medium">{c.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified By</span>
                    <span className="font-medium">{c.agent}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100 text-xs">
                    <span className="flex items-center gap-1 text-slate-400"><FiClock /> {c.submittedAt}</span>
                    <Link href={`/app/cases/${c.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2">
                        View Documents
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
