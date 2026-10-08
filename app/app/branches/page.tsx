"use client";

import { useState, useEffect } from "react";
import {
  FiGitBranch,
  FiPlus,
  FiX,
  FiMapPin,
  FiUser,
  FiPhone,
  FiSearch,
  FiUsers,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import { getBranchesApi, createBranchApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Branches Page ──────────────────────────────────────────────────────── */

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [manager, setManager] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranchesApi();
      setBranches(res.data.data || []);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  async function handleAddBranch() {
    if (!name.trim() || !city.trim() || !manager.trim()) {
      toast.error("Please fill in Branch Name, City, and Manager Name.");
      return;
    }

    try {
      await createBranchApi({
        name: name.trim(),
        city: city.trim(),
        manager: manager.trim(),
        phone: phone.trim() || undefined,
      });

      toast.success(`Branch "${name}" added successfully!`);
      setShowModal(false);
      setName("");
      setCity("");
      setManager("");
      setPhone("");
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create branch");
    }
  }

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.manager.toLowerCase().includes(search.toLowerCase())
  );

  const totalAgents = branches.reduce((acc, b) => acc + (b.agents || 0), 0);
  const totalActiveCases = branches.reduce((acc, b) => acc + (b.activeCases || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Branch Management"
        description="Manage regional hub offices, field officers, and operational case coverage."
        action={
          <Button
            className="text-white gap-2 shadow-md"
            style={{ background: "#1E3A5F" }}
            onClick={() => setShowModal(true)}
          >
            <FiPlus className="w-4 h-4" />
            Add Regional Branch
          </Button>
        }
      />

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center font-bold">
            <FiGitBranch size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Regional Hubs</p>
            <h4 className="text-2xl font-bold text-slate-900">{branches.length}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FiUsers size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Field Officers</p>
            <h4 className="text-2xl font-bold text-slate-900">{totalAgents}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FiFileText size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Operations Queue</p>
            <h4 className="text-2xl font-bold text-purple-700">{totalActiveCases}</h4>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md shadow-sm">
        <FiSearch className="text-slate-400" />
        <input
          placeholder="Search by branch name, city, or manager..."
          className="outline-none bg-transparent w-full text-xs text-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Branch Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </div>
          ))
        ) : filteredBranches.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <FiGitBranch size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No branches found matching your search</p>
          </div>
        ) : (
          filteredBranches.map((b, idx) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center font-bold">
                  <FiGitBranch className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                  HUB #{String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-0.5">{b.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-4 font-medium">
                <FiMapPin className="w-3.5 h-3.5 text-slate-400" />
                {b.city}
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Officers</p>
                  <p className="text-sm font-extrabold text-slate-900">{b.agents}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Active Cases</p>
                  <p className="text-sm font-extrabold text-blue-700">{b.activeCases}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1">
                <p className="text-xs text-slate-600 flex items-center justify-between">
                  <span className="text-slate-400">Branch Head:</span>
                  <span className="font-semibold text-slate-800">{b.manager}</span>
                </p>
                {b.phone && b.phone !== "—" && (
                  <p className="text-xs text-slate-600 flex items-center justify-between font-mono">
                    <span className="text-slate-400">Contact:</span>
                    <span className="text-slate-700">{b.phone}</span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add Branch Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Regional Branch</h2>
                <p className="text-xs text-slate-400 mt-0.5">Register a new branch hub for agent operations</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="branchName" className="text-xs font-semibold text-slate-700">
                  Branch Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="branchName"
                  placeholder="e.g. Coimbatore Hub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold text-slate-700">
                  City / Region <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="city"
                    placeholder="e.g. Coimbatore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manager" className="text-xs font-semibold text-slate-700">
                  Branch Manager / Officer <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="manager"
                    placeholder="e.g. Sundaram K"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="pl-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branchPhone" className="text-xs font-semibold text-slate-700">
                  Official Phone (Optional)
                </Label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="branchPhone"
                    placeholder="+91 98401 23456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 text-white rounded-xl text-xs font-semibold shadow-md"
                style={{ background: "#1E3A5F" }}
                onClick={handleAddBranch}
              >
                Create Branch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
