"use client";

import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiShield } from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";

const profile = {
  name: "Rohit Admin",
  role: "System Administrator",
  email: "admin@lvms.com",
  phone: "+91 98765 00001",
  branch: "Bangalore HQ",
  joined: "01 Jan 2025",
  lastLogin: "09 Jul 2026, 12:10 PM",
};

const stats = [
  { label: "Cases Managed",    value: "2,340" },
  { label: "Agents Under You", value: "245" },
  { label: "Reports Generated", value: "84" },
  { label: "Uploads Processed", value: "130" },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Profile" description="Your account information and activity summary." />

      {/* Profile Card */}
      <div className="card-flat p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar className="w-20 h-20 shrink-0">
            <AvatarFallback
              className="text-2xl font-bold"
              style={{ background: "#E8EFF8", color: "#1E3A5F" }}
            >
              RA
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {profile.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A5F]">
                <FiShield className="w-3 h-3 inline mr-1 -mt-0.5" />
                {profile.role}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
              {[
                { icon: <FiMail className="w-4 h-4" />,   label: profile.email },
                { icon: <FiPhone className="w-4 h-4" />,  label: profile.phone },
                { icon: <FiMapPin className="w-4 h-4" />, label: profile.branch },
                { icon: <FiUser className="w-4 h-4" />,   label: `Joined: ${profile.joined}` },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-slate-600">
                  <span className="text-slate-400">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <FiEdit2 className="w-3.5 h-3.5" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-flat p-4 text-center">
            <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {s.value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Last login */}
      <div className="card-flat p-5">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Last Login:</span>{" "}
          <span className="font-mono text-slate-500">{profile.lastLogin}</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Session from IP: 192.168.1.10 · Chrome on Windows
        </p>
      </div>
    </div>
  );
}
