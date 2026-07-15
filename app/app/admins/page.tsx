"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiEye, FiUserPlus, FiShield, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { getAdminsApi, registerAdminApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Admin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  status: "Active" | "Inactive";
};

const PAGE_SIZE = 5;

export default function AdminsPage() {
  const [search, setSearch]     = useState("");
  const [adminList, setAdminList] = useState<Admin[]>([]);
  const [selected, setSelected] = useState<Admin | null>(null);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  // Current User / Super Admin check
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Add Admin Form State
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAdminsApi();
      setAdminList(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetch('http://localhost:5000/api/v1/admin/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setCurrentUserEmail(res.data.email || "");
        }
      })
      .catch(() => {});
  }, []);

  const isSuperAdmin = currentUserEmail === "akshaya@gmail.com" || currentUserEmail === "adarshaldkar@gmail.com";

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerAdminApi({
        email,
        password,
        firstName,
        lastName,
        phone,
        branch,
      });
      toast.success("Admin registered successfully!");
      setAddOpen(false);
      // Reset form
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setBranch("");
      fetchAdmins();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register admin");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = adminList.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.branch.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrators"
        description="Manage system administrators and their access."
        action={
          isSuperAdmin ? (
            <Button
              className="text-white gap-2 cursor-pointer"
              style={{ background: "#1E3A5F" }}
              onClick={() => setAddOpen(true)}
            >
              <FiUserPlus className="w-4 h-4" />
              Add Admin
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search admins by name, email, or branch…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Admin", "Email", "Branch", "Status", ""].map((h) => (
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
                    <td className="px-5 py-4 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-7 rounded-md" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">No admins found.</td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(a)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs font-semibold" style={{ background: "#E8EFF8", color: "#1E3A5F" }}>
                            {a.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{a.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{a.email}</td>
                    <td className="px-5 py-4 text-slate-600">{a.branch}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        a.status === "Active" ? "badge-completed" : "badge-rejected"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(a); }}>
                        <FiEye className="w-4 h-4 text-slate-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} admins
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
                className={`h-7 w-7 p-0 text-xs font-semibold ${
                  p === safePage ? "text-white border-[#1E3A5F]" : "text-slate-700 hover:bg-slate-50"
                }`}
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

      {/* Admin Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[480px]">
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
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selected.status === "Active" ? "badge-completed" : "badge-rejected"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {selected.status}
                    </span>
                  </div>
                </div>
              </SheetHeader>
              <Separator className="mb-6" />
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Branch",           value: selected.branch },
                    { label: "Phone",            value: selected.phone || "—" },
                    { label: "Email",            value: selected.email },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Admin Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[400px] sm:w-[480px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Register New Admin</SheetTitle>
            <SheetDescription>Create a profile for a new system administrator.</SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch Name</Label>
              <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. Bangalore HQ" />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full text-white cursor-pointer mt-4"
              style={{ background: "#1E3A5F" }}
            >
              {submitting ? "Registering..." : "Register Admin"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
