"use client";

import { useState } from "react";
import { FiSettings, FiSave, FiBell, FiShield, FiDatabase } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Apex Financial Services Ltd.");
  const [email, setEmail] = useState("admin@lvms.com");
  const [slaDays, setSlaDays] = useState("3");

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Configure system-wide preferences and defaults."
      />

      {/* Org Settings */}
      <div className="card-flat p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <FiSettings className="w-4 h-4 text-[#1E3A5F]" />
          <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Organisation
          </h2>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orgName" className="text-xs text-slate-600">Organisation Name</Label>
          <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adminEmail" className="text-xs text-slate-600">Admin Contact Email</Label>
          <Input id="adminEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      {/* Verification SLA */}
      <div className="card-flat p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <FiShield className="w-4 h-4 text-[#1E3A5F]" />
          <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Verification SLA
          </h2>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slaDays" className="text-xs text-slate-600">
            Default SLA (working days from case creation)
          </Label>
          <Input
            id="slaDays"
            type="number"
            min={1}
            max={30}
            value={slaDays}
            onChange={(e) => setSlaDays(e.target.value)}
            className="w-32"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="card-flat p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiBell className="w-4 h-4 text-[#1E3A5F]" />
          <h2 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Notifications
          </h2>
        </div>
        {[
          "Email alerts for overdue cases",
          "Email digest — daily summary",
          "Notify on new Excel upload",
          "Notify when agent completes a case",
        ].map((label) => (
          <div key={label} className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-700">{label}</span>
            <button className="w-10 h-5 rounded-full bg-[#1E3A5F] relative flex-shrink-0">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={() => toast.success("Settings saved successfully")}
        className="bg-[#1E3A5F] hover:bg-[#2A4E7F] text-white gap-2"
      >
        <FiSave className="w-4 h-4" />
        Save Settings
      </Button>
    </div>
  );
}
