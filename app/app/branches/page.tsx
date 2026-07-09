"use client";

import { useState } from "react";
import { FiGitBranch, FiPlus, FiX, FiMapPin, FiUser, FiPhone } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";

/* ─── Types & Data ───────────────────────────────────────────────────────── */

type Branch = {
  id: string;
  name: string;
  city: string;
  agents: number;
  activeCases: number;
  manager: string;
  phone: string;
};

const initialBranches: Branch[] = [
  { id: "BR-001", name: "Bangalore HQ",  city: "Bangalore",  agents: 32, activeCases: 124, manager: "Rajesh Iyer",   phone: "+91 80 2345 6789" },
  { id: "BR-002", name: "Mumbai West",   city: "Mumbai",     agents: 28, activeCases: 98,  manager: "Sunita Shah",   phone: "+91 22 9876 5432" },
  { id: "BR-003", name: "Delhi North",   city: "Delhi",      agents: 24, activeCases: 87,  manager: "Pankaj Sharma", phone: "+91 11 8765 4321" },
  { id: "BR-004", name: "Hyderabad",     city: "Hyderabad",  agents: 18, activeCases: 65,  manager: "Anita Reddy",   phone: "+91 40 7654 3210" },
  { id: "BR-005", name: "Pune",          city: "Pune",       agents: 15, activeCases: 54,  manager: "Sunil Pawar",   phone: "+91 20 6543 2109" },
  { id: "BR-006", name: "Chennai South", city: "Chennai",    agents: 22, activeCases: 76,  manager: "Meera Nair",    phone: "+91 44 5432 1098" },
  { id: "BR-007", name: "Ahmedabad",     city: "Ahmedabad",  agents: 12, activeCases: 42,  manager: "Ravi Patel",    phone: "+91 79 4321 0987" },
  { id: "BR-008", name: "Jaipur",        city: "Jaipur",     agents: 10, activeCases: 35,  manager: "Sanjay Gupta",  phone: "+91 14 3210 9876" },
];

/* ─── Branches Page ──────────────────────────────────────────────────────── */

export default function BranchesPage() {
  const [branches, setBranches]   = useState<Branch[]>(initialBranches);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName]       = useState("");
  const [city, setCity]       = useState("");
  const [manager, setManager] = useState("");
  const [phone, setPhone]     = useState("");

  function handleAddBranch() {
    if (!name.trim() || !city.trim() || !manager.trim()) {
      toast.error("Please fill in Branch Name, City and Manager Name.");
      return;
    }
    const newBranch: Branch = {
      id: `BR-${String(branches.length + 1).padStart(3, "0")}`,
      name: name.trim(),
      city: city.trim(),
      manager: manager.trim(),
      phone: phone.trim() || "—",
      agents: 0,
      activeCases: 0,
    };
    setBranches((prev) => [...prev, newBranch]);
    toast.success(`Branch "${newBranch.name}" added successfully!`);
    setShowModal(false);
    setName(""); setCity(""); setManager(""); setPhone("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage all regional branch offices and their operations."
        action={
          <Button
            className="text-white gap-2"
            style={{ background: "#1E3A5F" }}
            onClick={() => setShowModal(true)}
          >
            <FiPlus className="w-4 h-4" />
            Add Branch
          </Button>
        }
      />

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="card-flat p-5 hover:shadow-sm transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FiGitBranch className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">{b.id}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-0.5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {b.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
              <FiMapPin className="w-3 h-3" />
              {b.city}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400 mb-0.5">Agents</p>
                <p className="text-sm font-bold text-slate-900">{b.agents}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400 mb-0.5">Active Cases</p>
                <p className="text-sm font-bold text-slate-900">{b.activeCases}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Manager: <span className="font-medium text-slate-700">{b.manager}</span>
            </p>
            {b.phone !== "—" && (
              <p className="text-xs text-slate-400 mt-0.5">{b.phone}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Add Branch Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                Add New Branch
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="branchName" className="text-xs text-slate-600">Branch Name <span className="text-rose-500">*</span></Label>
                <Input id="branchName" placeholder="e.g. Kolkata East" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs text-slate-600">City <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="city" placeholder="e.g. Kolkata" value={city} onChange={(e) => setCity(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manager" className="text-xs text-slate-600">Manager Name <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="manager" placeholder="e.g. Arjun Das" value={manager} onChange={(e) => setManager(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branchPhone" className="text-xs text-slate-600">Phone (optional)</Label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="branchPhone" placeholder="+91 33 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ background: "#1E3A5F" }}
                onClick={handleAddBranch}
              >
                Add Branch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
