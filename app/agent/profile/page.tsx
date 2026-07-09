"use client";

import {
  FiUser, FiPhone, FiMail, FiMapPin, FiShield, FiBriefcase,
  FiStar, FiCheckCircle, FiClock, FiCalendar,
} from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

/* ─── Mock Agent Profile ─────────────────────────────────────────────────── */

const AGENT = {
  name: "Amit Kumar",
  id: "AGT-001",
  email: "amit.kumar@lvms.com",
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

/* ─── Profile Page ───────────────────────────────────────────────────────── */

export default function AgentProfilePage() {
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
              AK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {AGENT.name}
            </h2>
            <p className="text-blue-200 text-sm">{AGENT.role}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <FiShield className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-xs font-mono text-blue-300">{AGENT.id}</span>
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
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-slate-400" />
          <h3 className="text-[13px] font-semibold text-slate-900">Personal Information</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { icon: FiMail,     label: "Email",    value: AGENT.email },
            { icon: FiPhone,    label: "Phone",    value: AGENT.phone },
            { icon: FiMapPin,   label: "Branch",   value: AGENT.branch },
            { icon: FiBriefcase, label: "Zone",    value: AGENT.zone },
            { icon: FiCalendar, label: "Joined",   value: AGENT.joinDate },
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
              <span className="font-bold text-slate-900">{AGENT.stats.successRate}%</span>
            </div>
            <Progress value={AGENT.stats.successRate} className="h-2" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Assigned",   value: AGENT.stats.totalAssigned, icon: FiBriefcase,   color: "#1E3A5F", bg: "#EEF2FF" },
              { label: "Completed",        value: AGENT.stats.completed,     icon: FiCheckCircle,  color: "#0D9488", bg: "#CCFBF1" },
              { label: "In Progress",      value: AGENT.stats.inProgress,    icon: FiClock,         color: "#D97706", bg: "#FEF3C7" },
              { label: "This Month",       value: AGENT.stats.thisMonth,     icon: FiCalendar,      color: "#6366F1", bg: "#EEF2FF" },
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
