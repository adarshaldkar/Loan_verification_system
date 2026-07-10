"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiEye, FiUserPlus, FiUserX, FiUserCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "sonner";
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
import { getAgentsApi, registerAgentApi, toggleAgentStatusApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Agent = {
  id: string;
  name: string;
  phone: string;
  branch: string;
  status: "Active" | "Inactive";
  activeCases: number;
  completedCases: number;
  successRate: number;
  avgTurnaround: string;
};

const PAGE_SIZE = 4;

export default function AgentsPage() {
  const [search, setSearch]     = useState("");
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  // Add Agent Form State
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await getAgentsApi();
      setAgentList(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerAgentApi({
        email,
        password,
        firstName,
        lastName,
        phone,
        branch,
      });
      toast.success("Agent registered successfully!");
      setAddOpen(false);
      // Reset form
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setBranch("");
      fetchAgents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register agent");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await toggleAgentStatusApi(agent.id);
      const nextStatus = agent.status === "Active" ? "Inactive" : "Active";
      toast.success(`Agent ${agent.name} is now ${nextStatus}`);
      setSelected(null);
      fetchAgents();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const filtered = agentList.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.branch.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Manage the field agent roster, workload, and performance."
        action={
          <Button
            className="text-white gap-2 cursor-pointer"
            style={{ background: "#1E3A5F" }}
            onClick={() => setAddOpen(true)}
          >
            <FiUserPlus className="w-4 h-4" />
            Add Agent
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search agents or branch…"
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
                {["Agent", "Branch", "Status", "Active Cases", "Completed", "Success Rate", "Avg. Turnaround", ""].map((h) => (
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-7 rounded-md" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">No agents registered.</td>
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
                    <td className="px-5 py-4 text-slate-600">{a.branch}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        a.status === "Active" ? "badge-completed" : "badge-rejected"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-900 font-semibold">{a.activeCases}</td>
                    <td className="px-5 py-4 text-slate-900 font-semibold">{a.completedCases}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 w-10 shrink-0">{a.successRate}%</span>
                        <Progress value={a.successRate} className="h-1.5 w-20" />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{a.avgTurnaround}</td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(a)}>
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
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} agents
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

      {/* Agent Detail Sheet */}
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
                    { label: "Active Cases",     value: selected.activeCases },
                    { label: "Completed Cases",  value: selected.completedCases },
                    { label: "Avg. Turnaround",  value: selected.avgTurnaround },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-400 mb-1">Success Rate</p>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{selected.successRate}%</p>
                    <Progress value={selected.successRate} className="h-1.5" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button
                  className="flex-1 text-white cursor-pointer"
                  style={{ background: "#1E3A5F" }}
                  onClick={() => {
                    setSelected(null);
                    toast.info(`Opening case history for ${selected.name}`);
                  }}
                >
                  View Case History
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 gap-2 cursor-pointer ${
                    selected.status === "Active"
                      ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                      : "text-teal-600 border-teal-200 hover:bg-teal-50"
                  }`}
                  onClick={() => handleToggleStatus(selected)}
                >
                  {selected.status === "Active" ? (
                    <><FiUserX className="w-4 h-4" /> Deactivate</>
                  ) : (
                    <><FiUserCheck className="w-4 h-4" /> Reactivate</>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Agent Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[400px] sm:w-[480px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Register New Agent</SheetTitle>
            <SheetDescription>Create a profile for a new field verification agent.</SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleAddAgent} className="space-y-4">
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
              {submitting ? "Registering..." : "Register Agent"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
