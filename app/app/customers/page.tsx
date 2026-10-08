"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiFilter, FiEye, FiBriefcase, FiPhone, FiMapPin,
  FiChevronLeft, FiChevronRight, FiUserCheck, FiMail, FiDollarSign,
  FiExternalLink, FiLayers, FiRefreshCw
} from "react-icons/fi";
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
import { VERIFICATION_PROFILES, getProfileByCode } from "@/lib/verificationProfiles";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { PaginationControls } from "@/components/shared/PaginationControls";

type Customer = {
  id: string;
  customerId?: string;
  caseId?: string | null;
  name: string;
  email?: string;
  phone: string;
  address: string;
  loanType: string;
  loanAmount?: number;
  businessName?: string;
  caseType?: string;
  caseStatus: VerificationStatus;
  assignedAgent?: string;
  branch: string;
  uploadDate: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/* ─── Customers Page ─────────────────────────────────────────────────────── */

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomersApi();
      setCustomers(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const filtered = customers.filter((c) => {
    const s = debouncedSearch.toLowerCase().trim();
    const matchSearch =
      !s ||
      c.name.toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s) ||
      (c.phone && c.phone.includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.branch && c.branch.toLowerCase().includes(s)) ||
      (c.assignedAgent && c.assignedAgent.toLowerCase().includes(s));

    const matchStatus = statusFilter === "All" || c.caseStatus === statusFilter;
    const matchType = typeFilter === "All" || (c.caseType && c.caseType === typeFilter);

    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Customers"
        description="Browse and manage all customer records dynamically across all 12 loan verification profile types."
        action={
          <Button
            variant="outline"
            className="gap-2 bg-white hover:bg-slate-50 border-slate-200"
            onClick={loadCustomers}
            disabled={loading}
          >
            <FiRefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID, phone, agent…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-40">
            <FiFilter className="w-4 h-4 text-slate-400 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Needs Revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { if (v) { setTypeFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-48">
            <FiLayers className="w-4 h-4 text-slate-400 mr-2" />
            <SelectValue placeholder="Profile Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All 12 Profiles</SelectItem>
            {VERIFICATION_PROFILES.map((p) => (
              <SelectItem key={p.code} value={p.code}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-slate-900/50">
                {["Customer", "Profile Type", "Phone", "Address", "Loan Amount", "Status", "Assigned Agent", "Branch", "Date", ""].map((h) => (
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
                    <td className="px-5 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-7 rounded-md" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No customers found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((c) => {
                  const prof = getProfileByCode(c.caseType || "RESIDENTIAL");
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="text-xs font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                              {c.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{c.id.slice(0, 12)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap", prof.badgeColor)}>
                          {prof.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{c.phone || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">{c.address || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">
                        {c.loanAmount ? formatCurrency(c.loanAmount) : c.loanType || "—"}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.caseStatus} /></td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{c.assignedAgent || "Unassigned"}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{c.branch || "Unassigned"}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{c.uploadDate}</td>
                      <td className="px-5 py-3.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                        >
                          <FiEye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <PaginationControls
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filtered.length}
          itemName="customers"
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      {/* ── Customer Detail Sheet ── */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] p-6 sm:p-8 overflow-y-auto">
          {selected && (() => {
            const prof = getProfileByCode(selected.caseType || "RESIDENTIAL");
            return (
              <>
                <SheetHeader className="mb-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14 shrink-0">
                      <AvatarFallback className="text-lg font-bold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                        {selected.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <SheetTitle className="text-xl font-bold text-slate-900">{selected.name}</SheetTitle>
                      <p className="text-xs text-slate-400 font-mono">App ID: {selected.id}</p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <StatusBadge status={selected.caseStatus} />
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", prof.badgeColor)}>
                          {prof.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <Separator className="mb-6" />

                <div className="space-y-4 text-sm">
                  {[
                    { icon: <FiPhone />, label: "Phone Number", value: selected.phone || "—" },
                    { icon: <FiMail />, label: "Email Address", value: selected.email || "—" },
                    { icon: <FiMapPin />, label: "Field Address", value: selected.address || "—" },
                    { icon: <FiDollarSign />, label: "Loan Amount", value: selected.loanAmount ? formatCurrency(selected.loanAmount) : "—" },
                    { icon: <FiBriefcase />, label: "Loan / Profile Type", value: `${selected.loanType || prof.name} (${prof.code})` },
                    { icon: <FiUserCheck />, label: "Assigned Agent", value: selected.assignedAgent || "Unassigned" },
                    { icon: <FiMapPin />, label: "Branch Office", value: selected.branch || "Unassigned" },
                    { icon: <FiSearch />, label: "Created / Uploaded Date", value: selected.uploadDate || "—" },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400 font-medium">{label}</p>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold break-words">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  {selected.caseId ? (
                    <Button
                      className="w-full text-white cursor-pointer gap-2 font-semibold shadow-sm bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                      onClick={() => {
                        router.push(`/app/cases/${selected.caseId}`);
                        setSelected(null);
                      }}
                    >
                      <FiExternalLink className="w-4 h-4" />
                      Open Case #{selected.caseId.slice(0, 8)} Review
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    className="w-full cursor-pointer gap-2 font-medium"
                    onClick={() => {
                      router.push(`/app/cases?search=${encodeURIComponent(selected.name)}`);
                      setSelected(null);
                    }}
                  >
                    <FiSearch className="w-4 h-4" />
                    Search Linked Cases
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

