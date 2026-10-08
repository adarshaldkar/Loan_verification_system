"use client";

import { useState, useEffect } from "react";
import {
  FiUser, FiPhone, FiMail, FiMapPin, FiShield, FiBriefcase,
  FiLock, FiX, FiEdit2, FiCheck, FiRefreshCw, FiCopy, FiCalendar,
  FiAward, FiActivity, FiKey, FiCheckCircle
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAgentProfileApi, updateAgentProfileApi, updateAgentPasswordApi } from "@/lib/api";

type AgentProfile = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  branch: string;
  joined: string;
  role?: string;
  zone?: string;
  stats: {
    total: number;
    completed: number;
    pending: number;
    successRate: number;
  };
};

export default function AgentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  
  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function loadProfile() {
    try {
      const res = await getAgentProfileApi();
      const profileData = res.data?.data;
      const fName = profileData.firstName || profileData.name?.split(" ")[0] || "Agent";
      const lName = profileData.lastName || profileData.name?.split(" ").slice(1).join(" ") || "";
      
      setAgent({
        ...profileData,
        firstName: fName,
        lastName: lName,
        role: "Senior Field Verification Officer",
        zone: profileData.branch ? `${profileData.branch} Metropolitan Zone` : "Chennai South Zone",
      });
      setFirstName(fName);
      setLastName(lName);
      setPhone(profileData.phone || "");
    } catch (error) {
      toast.error("Failed to load profile data from server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First Name and Last Name are required");
      return;
    }
    if (phone.trim()) {
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateAgentProfileApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      if (res.data?.success) {
        toast.success("Profile information updated successfully in database!");
        setAgent(prev => prev ? {
          ...prev,
          name: `${firstName.trim()} ${lastName.trim()}`,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        } : null);
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please complete all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await updateAgentPasswordApi({ oldPassword, newPassword });
      if (res.data?.success) {
        toast.success("Password changed securely!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Incorrect current password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-4xl" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800">
        <p className="text-gray-500">Agent profile could not be loaded</p>
        <button onClick={loadProfile} className="mt-3 text-xs font-bold text-[#1E4DB7] hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  const initials = agent.name.substring(0, 2).toUpperCase();
  const agentDisplayId = `LVMS-AGENT-${agent.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6 pb-16 text-slate-800 max-w-5xl" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── 1. Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            Field Officer Profile 👤
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Manage your agent credentials, verification branch zone, and account security
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active on Duty</span>
          </span>
        </div>
      </div>

      {/* ── 2. Executive Hero Profile Card ── */}
      <div className="bg-gradient-to-br from-[#0B1E3B] via-[#122E58] to-[#1E4DB7] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-24 -mb-16 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-3 border-white/40 shadow-lg">
              <AvatarFallback className="text-2xl font-black text-[#1E4DB7] bg-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">{agent.name}</h2>
                <FiCheckCircle className="w-4 h-4 text-emerald-400" title="Verified Agent" />
              </div>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">{agent.role}</p>
              
              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg">
                  <FiShield className="w-3.5 h-3.5 text-blue-300" />
                  <span className="font-mono text-[11px] font-bold text-blue-100">{agentDisplayId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(agent.id);
                      toast.success("Full Agent ID copied to clipboard!");
                    }}
                    className="ml-1 text-blue-300 hover:text-white"
                    title="Copy Full ID"
                  >
                    <FiCopy className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-blue-200 text-[11px]">
                  <FiCalendar className="w-3.5 h-3.5 text-blue-300" />
                  <span>Joined: {agent.joined}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <FiKey className="w-3.5 h-3.5 text-blue-300" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Live Performance KPI Strip (From Prisma) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-center relative z-10">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-200 block">Total Assigned</span>
            <p className="text-2xl font-black text-white mt-0.5">{agent.stats.total}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300 block">Verified & Done</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{agent.stats.completed}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-300 block">Pending Visits</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{agent.stats.pending}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-200 block">Approval Rate</span>
            <p className="text-2xl font-black text-white mt-0.5">{agent.stats.successRate}%</p>
          </div>
        </div>
      </div>

      {/* ── 3. Profile Information Form & Branch Specs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Personal Details Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-950 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                <FiUser className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Personal & Officer Details</h3>
                <p className="text-[11px] text-gray-400">Manage your contact information and identity record</p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-bold text-[#1E4DB7] bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E4DB7] hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">First Name</Label>
                <Input
                  disabled={!isEditing}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className={cn(
                    "text-xs rounded-xl",
                    !isEditing && "bg-gray-50 dark:bg-slate-900 border-gray-200 text-gray-700 font-semibold"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">Last Name</Label>
                <Input
                  disabled={!isEditing}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className={cn(
                    "text-xs rounded-xl",
                    !isEditing && "bg-gray-50 dark:bg-slate-900 border-gray-200 text-gray-700 font-semibold"
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">Mobile Phone Number</Label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={cn(
                    "text-xs rounded-xl pl-9",
                    !isEditing && "bg-gray-50 dark:bg-slate-900 border-gray-200 text-gray-700 font-semibold"
                  )}
                />
              </div>
              <p className="text-[10px] text-gray-400">Used by branch admins to coordinate live cases</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">Email Address (Read-only)</Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  disabled
                  value={agent.email}
                  className="text-xs rounded-xl pl-9 bg-gray-50 dark:bg-slate-900 text-gray-500 font-mono"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Branch, Coverage & Security Card */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-[#1E4DB7]" />
              Branch & Coverage Zone
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">Primary Branch</span>
                <p className="font-bold text-gray-800 dark:text-slate-200 mt-0.5">{agent.branch}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">Assigned Territory</span>
                <p className="font-bold text-gray-800 dark:text-slate-200 mt-0.5">{agent.zone}</p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 text-emerald-800 dark:text-emerald-300">
                <span className="text-[10px] font-bold block uppercase flex items-center gap-1">
                  <FiActivity className="w-3.5 h-3.5 text-emerald-600" /> Field Ready
                </span>
                <p className="text-[11px] font-medium mt-0.5">GPS location tracking and camera evidence features enabled.</p>
              </div>
            </div>
          </div>

          {/* Account Security Quick Action */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FiLock className="w-4 h-4 text-purple-600" />
              Credentials & Security
            </h3>
            <p className="text-xs text-gray-500">Regularly update your login credentials to secure case and customer data.</p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-900 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FiKey className="w-3.5 h-3.5 text-[#1E4DB7]" />
              <span>Change Login Password</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── 4. Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-950 rounded-3xl p-6 w-full max-w-sm border border-gray-100 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FiLock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Change Agent Password</h3>
                  <p className="text-[11px] text-gray-400">Enter your credentials</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">Current Password</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 px-3 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
                  className="flex-1 py-2.5 px-3 bg-[#1E4DB7] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  {changingPassword ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiCheck className="w-3.5 h-3.5" />}
                  <span>{changingPassword ? "Updating..." : "Save Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
