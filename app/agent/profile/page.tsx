"use client";

import { useState, useEffect } from "react";
import {
  FiUser, FiPhone, FiMail, FiMapPin, FiShield, FiBriefcase,
  FiStar, FiCheckCircle, FiClock, FiCalendar, FiEdit2, FiLock, FiX
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* ─── Mock Agent Profile ─────────────────────────────────────────────────── */

const AGENT = {
  name: "Arun Kumar",
  id: "AGT-1024",
  email: "arun.kumar@lvms.com",
  phone: "+91 98765 43210",
  branch: "Bangalore HQ",
  role: "Field Verification Agent",
  joinDate: "01 March 2024",
  zone: "South Bangalore",
  stats: {
    totalAssigned: 156,
    completed: 128,
    rejected: 8,
    inProgress: 5,
    avgTurnaround: "1.2 days",
    successRate: 95,
    thisWeek: 8,
    thisMonth: 31,
  },
};

export default function AgentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState(AGENT.phone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleUpdateProfile = () => {
    toast.success("Profile details updated successfully!");
    setIsEditingPhone(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Password changed successfully!");
    setShowPasswordModal(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-6 w-32" />

        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
          <div className="flex items-center gap-4 animate-pulse">
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      {/* Header */}
      <h1 className="text-xl font-bold text-slate-900">
        My Profile
      </h1>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#0F2240] to-[#1E3A5F] rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/30">
            <AvatarFallback className="text-xl font-bold text-[#1E3A5F]" style={{ background: "#E8EFF8" }}>
              AK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold">
              {AGENT.name}
            </h2>
            <p className="text-blue-200 text-sm">{AGENT.role}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <FiShield className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-xs font-mono text-blue-300">Agent ID: {AGENT.id}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="text-center">
            <p className="text-xl font-bold">{AGENT.stats.completed}</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Completed</p>
          </div>
          <div className="text-center border-x border-white/15">
            <p className="text-xl font-bold">{AGENT.stats.successRate}%</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{AGENT.stats.avgTurnaround}</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Avg. Time</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-slate-400" />
          <h3 className="text-[13px] font-semibold text-slate-900">Personal Information</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <FiMail className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Email Address</p>
              <p className="text-[13px] font-medium text-slate-800">{AGENT.email}</p>
            </div>
          </div>

          {/* Phone (Editable) */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <FiPhone className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Mobile Number</p>
                {isEditingPhone ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#1E3A5F]"
                  />
                ) : (
                  <p className="text-[13px] font-medium text-slate-800">{phone}</p>
                )}
              </div>
            </div>
            {isEditingPhone ? (
              <button onClick={handleUpdateProfile} className="text-xs font-semibold text-emerald-600 hover:underline">
                Save
              </button>
            ) : (
              <button onClick={() => setIsEditingPhone(true)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Branch */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <FiMapPin className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Branch Location</p>
              <p className="text-[13px] font-medium text-slate-800">{AGENT.branch}</p>
            </div>
          </div>

          {/* Zone */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <FiBriefcase className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Coverage Zone</p>
              <p className="text-[13px] font-medium text-slate-800">{AGENT.zone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowPasswordModal(true)}
          variant="outline"
          className="flex-1 rounded-xl gap-2 font-semibold text-xs border-slate-200"
        >
          <FiLock className="w-4 h-4" />
          Change Password
        </Button>
        <Button
          onClick={handleUpdateProfile}
          className="flex-1 rounded-xl text-white font-semibold text-xs"
          style={{ background: "#1E3A5F" }}
        >
          Update Profile
        </Button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Change Account Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Current Password</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button type="submit" className="w-full mt-3 rounded-xl text-white font-bold text-xs" style={{ background: "#1E3A5F" }}>
                Save Password
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
