"use client";

import { useState } from "react";
import { FiSearch, FiFilter, FiEye, FiBriefcase, FiPhone, FiMapPin } from "react-icons/fi";
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

/* ─── Mock Data ──────────────────────────────────────────────────────────── */

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  loanType: "Home Loan" | "Business Loan" | "Personal Loan" | "Vehicle Loan";
  caseStatus: VerificationStatus;
  branch: string;
  uploadDate: string;
};

const customers: Customer[] = [
  { id: "CUST-001", name: "Amit Kumar",     phone: "+91 98765 43210", address: "12, MG Road, Bangalore", loanType: "Home Loan",     caseStatus: "Completed",   branch: "Bangalore HQ", uploadDate: "18 May 2026" },
  { id: "CUST-002", name: "Priya Sharma",   phone: "+91 87654 32109", address: "45, Park St, Mumbai",    loanType: "Business Loan", caseStatus: "In Progress", branch: "Mumbai West",   uploadDate: "18 May 2026" },
  { id: "CUST-003", name: "Sandeep Yadav",  phone: "+91 76543 21098", address: "78, Civil Lines, Delhi", loanType: "Home Loan",     caseStatus: "Pending",     branch: "Delhi North",   uploadDate: "17 May 2026" },
  { id: "CUST-004", name: "Neha Verma",     phone: "+91 65432 10987", address: "90, Ring Rd, Hyderabad", loanType: "Business Loan", caseStatus: "Rejected",    branch: "Hyderabad",     uploadDate: "17 May 2026" },
  { id: "CUST-005", name: "Rahul Gupta",    phone: "+91 54321 09876", address: "23, Station Rd, Pune",   loanType: "Personal Loan", caseStatus: "Pending",     branch: "Pune",          uploadDate: "16 May 2026" },
  { id: "CUST-006", name: "Kavita Singh",   phone: "+91 43210 98765", address: "56, Lake View, Chennai", loanType: "Vehicle Loan",  caseStatus: "Completed",   branch: "Chennai South", uploadDate: "16 May 2026" },
  { id: "CUST-007", name: "Arvind Patel",   phone: "+91 32109 87654", address: "89, Gandhi Nagar, Ahmedabad", loanType: "Home Loan", caseStatus: "Completed", branch: "Ahmedabad",    uploadDate: "15 May 2026" },
  { id: "CUST-008", name: "Sunita Joshi",   phone: "+91 21098 76543", address: "34, Mall Rd, Jaipur",    loanType: "Business Loan", caseStatus: "In Progress", branch: "Jaipur",        uploadDate: "15 May 2026" },
];

/* ─── Customers Page ─────────────────────────────────────────────────────── */

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = statusFilter === "All" || c.caseStatus === statusFilter;
    return matchSearch && matchStatus;
  });

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
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No customers found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-[--color-brand-50] text-[--color-brand-900] font-semibold">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{c.phone}</td>
                    <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate">{c.address}</td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{c.loanType}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.caseStatus} /></td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{c.branch}</td>
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{c.uploadDate}</td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(c)}>
                        <FiEye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {customers.length} customers</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs bg-[--color-brand-900] text-white border-[--color-brand-900]">1</Button>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">2</Button>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">Next</Button>
          </div>
        </div>
      </div>

      {/* ── Customer Detail Sheet ── */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[480px]">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="text-lg bg-[--color-brand-50] text-[--color-brand-900] font-bold">
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
                  { icon: <FiPhone />, label: "Phone", value: selected.phone },
                  { icon: <FiMapPin />, label: "Address", value: selected.address },
                  { icon: <FiBriefcase />, label: "Loan Type", value: selected.loanType },
                  { icon: <FiMapPin />, label: "Branch", value: selected.branch },
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
                <Button className="w-full bg-[--color-brand-900] hover:bg-[--color-brand-800] text-white">
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
