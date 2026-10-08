"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiEye, FiUserPlus, FiShield, FiChevronLeft, FiChevronRight,
  FiEdit, FiMapPin, FiPhone, FiMail, FiBriefcase, FiUsers, FiCheckCircle, FiXCircle,
} from "react-icons/fi";
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
import { getAdminsApi, registerAdminApi, updateAdminApi, getProfileApi, getBranchesApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { z } from "zod";

const DEFAULT_BRANCHES = [
  "Bangalore HQ",
  "Chennai HQ",
  "Mumbai West",
  "Delhi North",
  "Hyderabad Hub",
  "Kolkata Central",
  "Pune Branch",
  "Ahmedabad Branch",
  "Jaipur Branch",
  "System",
];

type Admin = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  branch: string;
  role: string;
  status: "Active" | "Inactive";
  totalCases?: number;
  totalAgents?: number;
};

const PAGE_SIZE = 8;

export default function AdminsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [adminList, setAdminList] = useState<Admin[]>([]);
  const [selected, setSelected] = useState<Admin | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Current User / Super Admin check
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Branches list
  const [branchesList, setBranchesList] = useState<any[]>([]);

  // Add Admin Form State
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [submitting, setSubmitting] = useState(false);

  // Edit Admin Form State
  const [editOpen, setEditOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editRole, setEditRole] = useState("ADMIN");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");

  // Form Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAdminsApi();
      setAdminList(res.data.data || []);
    } catch (err: any) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await getBranchesApi();
      setBranchesList(res.data.data || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchBranches();
    getProfileApi()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setCurrentUserEmail(res.data.data.email || "");
          setIsSuperAdmin(res.data.data.role === "SUPER_ADMIN");
        }
      })
      .catch(() => {});
  }, []);

  const allBranchOptions = Array.from(
    new Set([
      ...branchesList.map((b) => b.name),
      ...adminList.map((a) => a.branch).filter((b) => b && b !== "Unassigned"),
      ...DEFAULT_BRANCHES,
    ])
  );

  const handleOpenAdd = () => {
    setFormErrors({});
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setBranch("Bangalore HQ");
    setRole("ADMIN");
    setAddOpen(true);
  };

  const handleOpenEdit = (a: Admin) => {
    setFormErrors({});
    setEditingAdminId(a.id);
    setEditEmail(a.email);
    setEditPassword("");
    const names = a.name.split(" ");
    setEditFirstName(a.firstName || names[0] || "");
    setEditLastName(a.lastName || names.slice(1).join(" ") || "");
    setEditPhone(a.phone || "");
    setEditBranch(a.branch || "System");
    setEditRole(a.role || "ADMIN");
    setEditStatus(a.status);
    setEditOpen(true);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const adminSchema = z.object({
      firstName: z.string().min(2, "First Name must be at least 2 characters"),
      lastName: z.string().min(1, "Last Name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      phone: z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, "Phone must be a valid 10-digit number").optional().or(z.literal("")),
      branch: z.string().min(1, "Branch is required"),
    });

    const result = adminSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      phone,
      branch,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      toast.error(result.error.issues[0].message);
      setSubmitting(false);
      return;
    }

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

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const editSchema = z.object({
      firstName: z.string().min(2, "First Name must be at least 2 characters"),
      lastName: z.string().min(1, "Last Name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
      phone: z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, "Phone must be a valid 10-digit number").optional().or(z.literal("")),
      branch: z.string().min(1, "Branch is required"),
    });

    const result = editSchema.safeParse({
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      password: editPassword,
      phone: editPhone,
      branch: editBranch,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      toast.error(result.error.issues[0].message);
      setSubmitting(false);
      return;
    }

    try {
      await updateAdminApi(editingAdminId, {
        email: editEmail,
        password: editPassword || undefined,
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        branch: editBranch,
        role: editRole,
        isActive: editStatus === "Active",
      });
      toast.success("Admin profile updated successfully!");
      setEditOpen(false);
      fetchAdmins();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update admin");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = adminList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.branch.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone && a.phone.includes(search));

    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchesBranch = branchFilter === "ALL" || a.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrators"
        description="Manage system administrators, branch assignments, and access privileges."
        action={
          isSuperAdmin ? (
            <Button
              className="text-white gap-2 cursor-pointer shadow-sm"
              style={{ background: "#1E3A5F" }}
              onClick={handleOpenAdd}
            >
              <FiUserPlus className="w-4 h-4" />
              Add Admin
            </Button>
          ) : undefined
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search admin, email, branch…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="inline-flex rounded-lg border border-border bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
            {(["ALL", "Active", "Inactive"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors",
                  statusFilter === st ? "bg-white shadow-xs font-semibold text-slate-900" : "hover:text-slate-900"
                )}
              >
                {st === "ALL" ? "All Admins" : st}
              </button>
            ))}
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
          >
            <option value="ALL">All Branches</option>
            {allBranchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Count summary */}
        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Total: <span className="font-bold text-slate-900">{filtered.length}</span> administrators
        </div>
      </div>

      {/* Table */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Admin Name", "Email", "Branch", "Role", "Agents", "Cases", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap",
                      h === "Actions" ? "text-right" : "text-left"
                    )}
                  >
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No administrators found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    onClick={() => setSelected(a)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback
                            className="text-xs font-semibold"
                            style={{ background: "#E8EFF8", color: "#1E3A5F" }}
                          >
                            {a.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {a.name}
                            {a.email === currentUserEmail && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{a.phone || a.id.slice(0, 8) + "..."}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{a.email}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{a.branch}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          a.role === "SUPER_ADMIN"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        <FiShield className="w-3 h-3" />
                        {a.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-bold">{a.totalAgents ?? 0}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-bold">{a.totalCases ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === "Active" ? "badge-completed" : "badge-rejected"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          title="View Details"
                          onClick={() => setSelected(a)}
                        >
                          <FiEye className="w-4 h-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-800"
                            title="Edit Administrator"
                            onClick={() => handleOpenEdit(a)}
                          >
                            <FiEdit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} admins
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
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
              variant="outline"
              size="sm"
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
        <SheetContent className="w-[440px] sm:w-[500px] p-6 sm:p-8 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border border-border shadow-xs">
                    <AvatarFallback
                      className="text-lg font-bold"
                      style={{ background: "#E8EFF8", color: "#1E3A5F" }}
                    >
                      {selected.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl font-bold text-slate-900">{selected.name}</SheetTitle>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          selected.status === "Active" ? "badge-completed" : "badge-rejected"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {selected.status}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {selected.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Separator className="mb-6" />

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account & Location</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                      <FiMapPin className="w-3 h-3" /> Branch
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{selected.branch}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                      <FiPhone className="w-3 h-3" /> Phone
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{selected.phone || "—"}</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Scope of Responsibility</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 mb-0.5">Managed Agents</p>
                    <p className="text-lg font-bold text-indigo-700">{selected.totalAgents ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 mb-0.5">Assigned Cases</p>
                    <p className="text-lg font-bold text-teal-700">{selected.totalCases ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-2.5">
                <Button
                  className="w-full text-white cursor-pointer text-xs gap-1.5 font-semibold"
                  style={{ background: "#1E3A5F" }}
                  onClick={() => {
                    router.push(`/app/cases`);
                    setSelected(null);
                  }}
                >
                  <FiBriefcase className="w-3.5 h-3.5" /> View Cases Overview
                </Button>

                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer text-xs gap-1.5 font-semibold text-slate-700 border-slate-300"
                    onClick={() => {
                      handleOpenEdit(selected);
                      setSelected(null);
                    }}
                  >
                    <FiEdit className="w-3.5 h-3.5 text-slate-500" /> Edit Admin Profile
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Admin Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[440px] sm:w-[500px] p-6 sm:p-8 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Register New Admin</SheetTitle>
            <SheetDescription>Create a profile for a new system administrator.</SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  placeholder="e.g. Adarsh"
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: "" }));
                  }}
                  className={formErrors.firstName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {formErrors.firstName && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  placeholder="e.g. Patel"
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: "" }));
                  }}
                  className={formErrors.lastName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {formErrors.lastName && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={formErrors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {formErrors.email && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="Min 6 characters"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                }}
                className={formErrors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {formErrors.password && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="+91 98765 43210"
                className={formErrors.phone ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {formErrors.phone && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch Name *</Label>
              <select
                id="branch"
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  if (formErrors.branch) setFormErrors((prev) => ({ ...prev, branch: "" }));
                }}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm",
                  formErrors.branch ? "border-rose-500 focus-visible:ring-rose-500" : ""
                )}
              >
                <option value="">Select a branch</option>
                {allBranchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {formErrors.branch && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.branch}</p>}
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

      {/* Edit Admin Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-[440px] sm:w-[500px] p-6 sm:p-8 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Edit Administrator</SheetTitle>
            <SheetDescription>Update the system administrator's profile details.</SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleEditAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className={formErrors.firstName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {formErrors.firstName && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className={formErrors.lastName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {formErrors.lastName && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={formErrors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {formErrors.email && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPassword">Password (leave blank to keep current)</Label>
              <Input
                id="editPassword"
                type="password"
                value={editPassword}
                placeholder="••••••"
                onChange={(e) => setEditPassword(e.target.value)}
                className={formErrors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {formErrors.password && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={formErrors.phone ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {formErrors.phone && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editBranch">Branch Name *</Label>
              <select
                id="editBranch"
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors md:text-sm",
                  formErrors.branch ? "border-rose-500 focus-visible:ring-rose-500" : ""
                )}
              >
                {allBranchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {formErrors.branch && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.branch}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editStatusSelect">Status</Label>
              <select
                id="editStatusSelect"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors md:text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full text-white cursor-pointer mt-4"
              style={{ background: "#1E3A5F" }}
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
