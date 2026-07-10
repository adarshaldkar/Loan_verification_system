"use client";

import { useState } from "react";
import { FiSettings, FiSave, FiBell, FiShield, FiDatabase } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Apex Financial Services Ltd.");
  const [email, setEmail]     = useState("admin@lvms.com");
  const [slaDays, setSlaDays] = useState("3");
  const [toggles, setToggles] = useState({
    "Email alerts for overdue cases": true,
    "Email digest — daily summary": true,
    "Notify on new Excel upload": false,
    "Notify when agent completes a case": false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="card-flat p-6 space-y-5 bg-white border border-border rounded-xl">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function flipToggle(label: string) {
    setToggles((prev) => ({ ...prev, [label]: !prev[label as keyof typeof prev] }));
  }

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

      <Button
        onClick={() => {
          if (!orgName.trim() || !email.trim()) {
            toast.error("Organisation name and email are required.");
            return;
          }
          toast.success("Settings saved successfully");
        }}
        className="text-white gap-2"
        style={{ background: "#1E3A5F" }}
      >
        <FiSave className="w-4 h-4" />
        Save Settings
      </Button>
    </div>
  );
}
