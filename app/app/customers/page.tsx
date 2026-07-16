"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiFilter, FiEye, FiBriefcase, FiPhone, FiMapPin, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, type VerificationStatus } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCustomersApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  loanType: string;
  caseStatus: VerificationStatus;
  branch: string;
  uploadDate: string;
};

const PAGE_SIZE = 5;

/* ─── Customers Page ─────────────────────────────────────────────────────── */

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected]     = useState<Customer | null>(null);
  const [page, setPage]             = useState(1);
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = await getCustomersApi();
        setCustomers(res.data.data);
      } catch (err) {
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = statusFilter === "All" || c.caseStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Browse and manage all customer records from Excel imports."
      />

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID, or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-44">
            <FiFilter className="w-4 h-4 text-slate-400 mr-2" />
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
      </div>

      {/* ── Table ── */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Customer", "Phone", "Address", "Loan Type", "Case Status", "Branch", "Upload Date", ""].map((h) => (
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
                    <td className="px-5 py-4 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-7 rounded-md" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No customers found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{c.phone || "—"}</td>
                    <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate">{c.address}</td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{c.loanType}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.caseStatus} /></td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{c.branch}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{c.uploadDate}</td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>
                        <FiEye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} customers
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              disabled={safePage === 1}
              onClick={() => goTo(safePage - 1)}
            >
              <FiChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 text-xs font-semibold",
                  p === safePage
                    ? "text-white border-[#1E3A5F]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
                style={p === safePage ? { background: "#1E3A5F" } : {}}
                onClick={() => goTo(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline" size="sm"
              className="h-7 px-2.5 text-xs gap-1"
              disabled={safePage === totalPages}
              onClick={() => goTo(safePage + 1)}
            >
              Next <FiChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Customer Detail Sheet ── */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[480px] p-6 sm:p-8">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="text-lg font-bold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                      {selected.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">{selected.name}</SheetTitle>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.id}</p>
                    <div className="mt-2"><StatusBadge status={selected.caseStatus} /></div>
                  </div>
                </div>
              </SheetHeader>
              <Separator className="mb-6" />
              <div className="space-y-4 text-sm">
                {[
                  { icon: <FiPhone />, label: "Phone",       value: selected.phone || "—" },
                  { icon: <FiMapPin />, label: "Address",    value: selected.address },
                  { icon: <FiBriefcase />, label: "Loan Type", value: selected.loanType },
                  { icon: <FiMapPin />, label: "Branch",     value: selected.branch },
                  { icon: <FiSearch />, label: "Upload Date", value: selected.uploadDate },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 text-slate-400">{icon}</span>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="text-slate-900 font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button
                  className="w-full text-white cursor-pointer"
                  style={{ background: "#1E3A5F" }}
                  onClick={() => {
                    router.push(`/app/cases?search=${encodeURIComponent(selected.name)}`);
                    setSelected(null);
                  }}
                >
                  View Linked Case
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
