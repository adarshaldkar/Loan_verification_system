"use client";

import { useState, useEffect } from "react";
import {
  FiUser, FiPhone, FiMail, FiMapPin, FiShield, FiBriefcase,
  FiStar, FiCheckCircle, FiClock, FiCalendar,
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getAgentProfileApi } from "@/lib/api";
import { toast } from "sonner";

/* ─── Profile Page ───────────────────────────────────────────────────────── */
export default function AgentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgentProfileApi()
      .then((res) => {
        setProfile(res.data.data);
      })
      .catch((err) => {
        toast.error("Failed to load profile data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-[#1E3A5F]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="40" strokeDashoffset="10" />
        </svg>
      </div>
    );
  }

  if (!profile) return <div>Profile not found</div>;

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
        My Profile
      </h1>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#0F2240] to-[#1E3A5F] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/30">
            <AvatarFallback className="text-xl font-bold text-[#1E3A5F]" style={{ background: "#E8EFF8" }}>
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-blue-200 text-sm">{profile.role || "Field Agent"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <FiShield className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-xs font-mono text-blue-300">{profile.id}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="text-center">
            <p className="text-xl font-bold">{profile.stats?.completed || 0}</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Completed</p>
          </div>
          <div className="text-center border-x border-white/15">
            <p className="text-xl font-bold">{profile.stats?.successRate || 0}%</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{profile.stats?.avgTurnaround || "N/A"}</p>
            <p className="text-[10px] text-blue-300 mt-0.5">Avg. Time</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-slate-400" />
          <h3 className="text-[13px] font-semibold text-slate-900">Personal Information</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { icon: FiMail,     label: "Email",    value: profile.email },
            { icon: FiPhone,    label: "Phone",    value: profile.phone || "Not provided" },
            { icon: FiMapPin,   label: "Branch",   value: profile.branch || "Unassigned" },
            { icon: FiBriefcase, label: "Zone",    value: profile.zone || "Unassigned" },
            { icon: FiCalendar, label: "Joined",   value: new Date(profile.createdAt).toLocaleDateString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className="text-[13px] font-medium text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiStar className="w-4 h-4 text-amber-400" />
          <h3 className="text-[13px] font-semibold text-slate-900">Performance Overview</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Success rate bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium">Success Rate</span>
              <span className="font-bold text-slate-900">{profile.stats?.successRate || 0}%</span>
            </div>
            <Progress value={profile.stats?.successRate || 0} className="h-2" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Assigned",   value: profile.stats?.totalAssigned || 0, icon: FiBriefcase,   color: "#1E3A5F", bg: "#EEF2FF" },
              { label: "Completed",        value: profile.stats?.completed || 0,     icon: FiCheckCircle,  color: "#0D9488", bg: "#CCFBF1" },
              { label: "In Progress",      value: profile.stats?.inProgress || 0,    icon: FiClock,         color: "#D97706", bg: "#FEF3C7" },
              { label: "This Month",       value: profile.stats?.thisMonth || 0,     icon: FiCalendar,      color: "#6366F1", bg: "#EEF2FF" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: bg }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <p className="text-[10px] font-medium" style={{ color }}>{label}</p>
                </div>
                <p className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
