"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiEye, FiUserPlus, FiUserX, FiUserCheck, FiChevronLeft, FiChevronRight,
  FiEdit2, FiMapPin, FiPhone, FiMail, FiNavigation, FiBriefcase, FiFilter,
} from "react-icons/fi";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { getAgentsApi, registerAgentApi, toggleAgentStatusApi, getBranchesApi, updateAgentApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const agentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[+]?[0-9\s-]{10,15}$/, "Invalid phone format"),
  branch: z.string().min(1, "Branch name is required"),
});

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
];

type Agent = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  branch: string;
  status: "Active" | "Inactive";
  activeCases: number;
  completedCases: number;
  rejectedCases?: number;
  totalCases?: number;
  successRate: number;
  avgTurnaround: string;
};

const PAGE_SIZE = 8;

export default function AgentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Add / Edit Agent Form State
  const [addOpen, setAddOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await getAgentsApi();
      setAgentList(res.data.data || []);
    } catch (err: any) {
      toast.error("Failed to load agents");
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
    fetchAgents();
    fetchBranches();
  }, []);

  const handleOpenAdd = () => {
    setEditAgentId(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setBranch("");
    setErrors({});
    setAddOpen(true);
  };

  const handleOpenEdit = (agent: any) => {
    setEditAgentId(agent.id);
    setFirstName(agent.firstName || agent.name.split(" ")[0] || "");
    setLastName(agent.lastName || agent.name.split(" ").slice(1).join(" ") || "");
    setEmail(agent.email || "");
    setPhone(agent.phone || "");
    setBranch(agent.branch && agent.branch !== "Unassigned" ? agent.branch : "");
    setPassword("");
    setErrors({});
    setAddOpen(true);
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod validation
    const validationResult = agentSchema.safeParse({
      firstName,
      lastName,
      email,
      phone,
      branch,
    });

    if (!validationResult.success) {
      const errMap: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          errMap[err.path[0] as string] = err.message;
        }
      });
      setErrors(errMap);
      const firstError = validationResult.error.issues[0]?.message || "Validation error";
      toast.error(firstError);
      return;
    }

    if (!editAgentId && (!password || password.length < 6)) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters" }));
      toast.error("Password must be at least 6 characters");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (editAgentId) {
        await updateAgentApi(editAgentId, {
          email,
          password: password || undefined,
          firstName,
          lastName,
          phone,
          branch,
        });
        toast.success("Agent profile updated successfully!");
      } else {
        await registerAgentApi({
          email,
          password,
          firstName,
          lastName,
          phone,
          branch,
        });
        toast.success("Agent registered successfully!");
      }
      setAddOpen(false);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setBranch("");
      setEditAgentId(null);
      fetchAgents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit agent details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await toggleAgentStatusApi(agent.id);
      const nextStatus = agent.status === "Active" ? "Inactive" : "Active";
      toast.success(`Agent ${agent.name} is now ${nextStatus}`);
      setSelected((prev) => (prev ? { ...prev, status: nextStatus } : null));
      fetchAgents();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  // Merge available branch names for dropdown
  const allBranchOptions = Array.from(
    new Set([
      ...branchesList.map((b) => b.name),
      ...agentList.map((a) => a.branch).filter((b) => b && b !== "Unassigned"),
      ...DEFAULT_BRANCHES,
    ])
  );

  const filtered = agentList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.branch.toLowerCase().includes(search.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
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
        title="Agents"
        description="Manage the field agent roster, workload, and performance."
        action={
          <Button
            className="text-white gap-2 cursor-pointer shadow-sm"
            style={{ background: "#1E3A5F" }}
            onClick={handleOpenAdd}
          >
            <FiUserPlus className="w-4 h-4" />
            Add Agent
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search agent, branch, phone…"
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
                {st === "ALL" ? "All Agents" : st}
              </button>
            ))}
          </div>

          {/* Branch Filter Dropdown */}
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
          Total: <span className="font-bold text-slate-900">{filtered.length}</span> agents
        </div>
      </div>

      {/* Table */}
      <div className="card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                {["Agent", "Branch", "Status", "Active Cases", "Completed", "Success Rate", "Avg. Turnaround", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={cn(
                        "px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap",
                        h === "Actions" ? "text-right" : "text-left"
                      )}
                    >
                      {h}
                    </th>
                  )
                )}
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No agents matching the selected criteria.
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
                          <p className="font-semibold text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{a.email || `${a.id.slice(0, 8)}...`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{a.branch}</td>
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
                    <td className="px-5 py-3.5 text-slate-900 font-bold">{a.activeCases}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-bold">{a.completedCases}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 w-8 shrink-0">{a.successRate}%</span>
                        <Progress value={a.successRate} className="h-1.5 w-16" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{a.avgTurnaround}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          title="View Details"
                          onClick={() => setSelected(a)}
                        >
                          <FiEye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                          title="Edit Agent Profile"
                          onClick={() => handleOpenEdit(a)}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Button>
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
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} agents
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

      {/* Agent Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[500px] p-6 sm:p-8 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-start justify-between">
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
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.email || selected.id}</p>
                      <span
                        className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          selected.status === "Active" ? "badge-completed" : "badge-rejected"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {selected.status}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Separator className="mb-6" />

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Location</h4>
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

                {/* Performance Metrics */}
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 mb-0.5">Active Cases</p>
                    <p className="text-lg font-bold text-amber-700">{selected.activeCases}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 mb-0.5">Completed Cases</p>
                    <p className="text-lg font-bold text-teal-700">{selected.completedCases}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 mb-0.5">Avg. Turnaround</p>
                    <p className="text-sm font-semibold text-slate-900">{selected.avgTurnaround}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-border/50">
                    <p className="text-[11px] text-slate-400 mb-1">Success Rate</p>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-900">{selected.successRate}%</p>
                    </div>
                    <Progress value={selected.successRate} className="h-1.5" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="text-white cursor-pointer text-xs gap-1.5 font-semibold"
                    style={{ background: "#1E3A5F" }}
                    onClick={() => {
                      router.push(`/app/cases?search=${encodeURIComponent(selected.name)}`);
                      setSelected(null);
                    }}
                  >
                    <FiBriefcase className="w-3.5 h-3.5" /> View Cases
                  </Button>
                  <Button
                    variant="outline"
                    className="text-slate-700 cursor-pointer text-xs gap-1.5 font-semibold border-slate-300"
                    onClick={() => {
                      router.push(`/app/live-tracking`);
                      setSelected(null);
                    }}
                  >
                    <FiNavigation className="w-3.5 h-3.5 text-blue-600" /> Track Agent
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="cursor-pointer text-xs gap-1.5 font-semibold text-slate-700 border-slate-300"
                    onClick={() => {
                      handleOpenEdit(selected);
                      setSelected(null);
                    }}
                  >
                    <FiEdit2 className="w-3.5 h-3.5 text-slate-500" /> Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className={`cursor-pointer text-xs gap-1.5 font-semibold ${
                      selected.status === "Active"
                        ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                        : "text-teal-600 border-teal-200 hover:bg-teal-50"
                    }`}
                    onClick={() => handleToggleStatus(selected)}
                  >
                    {selected.status === "Active" ? (
                      <>
                        <FiUserX className="w-3.5 h-3.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <FiUserCheck className="w-3.5 h-3.5" /> Reactivate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Agent Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] p-6 sm:p-8 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">{editAgentId ? "Edit Agent Profile" : "Register New Agent"}</SheetTitle>
            <SheetDescription>
              {editAgentId
                ? "Modify field agent profile details below."
                : "Create a profile for a new field verification agent."}
            </SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleAddAgent} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  placeholder="e.g. Rahul"
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: "" }));
                  }}
                  className={errors.firstName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.firstName && <p className="text-[10px] text-rose-500 font-semibold">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  placeholder="e.g. Sharma"
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
                  }}
                  className={errors.lastName ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {errors.lastName && <p className="text-[10px] text-rose-500 font-semibold">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.email && <p className="text-[10px] text-rose-500 font-semibold">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password {editAgentId ? "(leave blank to keep current)" : "*"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder={editAgentId ? "••••••••" : "Min 6 characters"}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className={errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.password && <p className="text-[10px] text-rose-500 font-semibold">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="+91 98765 43210"
                className={errors.phone ? "border-rose-500 focus-visible:ring-rose-500" : ""}
              />
              {errors.phone && <p className="text-[10px] text-rose-500 font-semibold">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch Name *</Label>
              <select
                id="branch"
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  if (errors.branch) setErrors((prev) => ({ ...prev, branch: "" }));
                }}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  errors.branch ? "border-rose-500 focus-visible:ring-rose-500" : ""
                )}
              >
                <option value="">Select a branch</option>
                {allBranchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {errors.branch && <p className="text-[10px] text-rose-500 font-semibold">{errors.branch}</p>}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full text-white cursor-pointer mt-4"
              style={{ background: "#1E3A5F" }}
            >
              {submitting ? "Submitting..." : editAgentId ? "Save Agent Profile" : "Register Agent"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
