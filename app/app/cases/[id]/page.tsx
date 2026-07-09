"use client";

import { use } from "react";
import Link from "next/link";
import {
  FiArrowLeft, FiCheckCircle, FiAlertTriangle, FiDownload,
  FiMapPin, FiClock, FiUser, FiHome, FiBriefcase, FiCamera,
} from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

/* ─── Mock Case Data ─────────────────────────────────────────────────────── */

const caseData = {
  id: "LV-2026-10818",
  customer: "Sandeep Yadav",
  type: "Residential" as const,
  status: "Completed" as const,
  agent: "Amit Kumar",
  branch: "Delhi North",
  submittedAt: "18 May 2026, 09:20 AM",
  gps: { lat: "28.6139° N", lng: "77.2090° E" },
  residential: {
    met: "Yes",
    applicantAvailable: "Yes",
    residenceConfirmed: "Yes",
    houseArea: "950 sq. ft.",
    ownership: "Own House",
    rentAmount: "N/A",
    yearsOfStay: "8 years",
    familyMembers: 4,
    applicantDetails: "Sandeep Yadav — Age 38",
    wifeDetails: "Rekha Yadav — Age 34",
    sonDetails: "Rohan Yadav — Age 10",
  },
  remarks: "Residence confirmed. Applicant and family present. House is well-maintained in a residential society. All details match with loan application.",
  auditTrail: [
    { actor: "System",      action: "Case created and assigned",        time: "15 May 2026, 10:00 AM" },
    { actor: "Amit Kumar",  action: "Case accepted and visit started",  time: "18 May 2026, 08:45 AM" },
    { actor: "Amit Kumar",  action: "Verification form submitted",      time: "18 May 2026, 09:15 AM" },
    { actor: "Amit Kumar",  action: "Geo-tagged photos uploaded",       time: "18 May 2026, 09:18 AM" },
    { actor: "Rohit Admin", action: "Verification approved & closed",   time: "18 May 2026, 09:20 AM" },
  ],
};

/* ─── Field Row ──────────────────────────────────────────────────────────── */

function FieldRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-slate-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right flex-1">{value}</span>
    </div>
  );
}

/* ─── Mock Photo Card ────────────────────────────────────────────────────── */

function GeoPhotoCard({ index }: { index: number }) {
  const colors = ["#e2e8f0", "#dbeafe", "#dcfce7"];
  return (
    <div className="rounded-xl overflow-hidden border border-border relative group">
      {/* Placeholder image */}
      <div
        className="w-full h-40 flex items-center justify-center text-slate-300"
        style={{ background: colors[index % 3] }}
      >
        <FiCamera className="w-8 h-8" />
      </div>
      {/* GPS overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2 text-[10px] text-white font-mono flex justify-between items-center">
        <span>28.6139°N, 77.2090°E</span>
        <span>18 May 2026, 09:15 AM</span>
      </div>
    </div>
  );
}

/* ─── Case Detail Page ───────────────────────────────────────────────────── */

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const c = caseData; // In real app: fetch by id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/cases">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <FiArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Case Detail
            </h1>
            <span className="font-mono text-sm text-slate-500">{c.id}</span>
            <StatusBadge status={c.status} />
            <Badge variant="outline" className="text-xs">
              {c.type}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Customer: <span className="font-medium text-slate-700">{c.customer}</span>
            {" · "}Agent: <span className="font-medium text-slate-700">{c.agent}</span>
            {" · "}Branch: <span className="font-medium text-slate-700">{c.branch}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <FiDownload className="w-3.5 h-3.5" />
            Export PDF
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-rose-700 hover:bg-rose-800 text-white">
            <FiAlertTriangle className="w-3.5 h-3.5" />
            Flag
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-[--color-status-completed] hover:opacity-90 text-white">
            <FiCheckCircle className="w-3.5 h-3.5" />
            Approve
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos & GPS</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Verification Fields */}
            <div className="card-flat p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiHome className="w-4 h-4 text-[--color-brand-900]" />
                <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  Residential Verification
                </h3>
              </div>
              {Object.entries(c.residential).map(([key, val]) => (
                <FieldRow
                  key={key}
                  label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  value={val}
                />
              ))}
            </div>

            {/* GPS + Remarks */}
            <div className="flex flex-col gap-5">
              <div className="card-flat p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiMapPin className="w-4 h-4 text-[--color-brand-900]" />
                  <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                    GPS & Visit Info
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 mb-1">LATITUDE</p>
                    <p className="font-mono font-semibold text-slate-900 text-xs">{c.gps.lat}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 mb-1">LONGITUDE</p>
                    <p className="font-mono font-semibold text-slate-900 text-xs">{c.gps.lng}</p>
                  </div>
                </div>
                <div className="mt-3 bg-slate-100 rounded-xl h-36 flex items-center justify-center text-slate-300 text-sm">
                  Map view (mapcn)
                </div>
              </div>

              <div className="card-flat p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FiUser className="w-4 h-4 text-[--color-brand-900]" />
                  <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                    Agent Remarks
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{c.remarks}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                  <FiClock className="w-3.5 h-3.5" />
                  Submitted: {c.submittedAt}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Photos Tab ── */}
        <TabsContent value="photos" className="mt-5">
          <div className="card-flat p-5">
            <h3 className="text-[14px] font-semibold text-slate-900 mb-4" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Geo-tagged Photos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <GeoPhotoCard key={i} index={i} />)}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              All photos are embedded with GPS coordinates and timestamps as proof of physical presence.
            </p>
          </div>
        </TabsContent>

        {/* ── Audit Tab ── */}
        <TabsContent value="audit" className="mt-5">
          <div className="card-flat p-5">
            <h3 className="text-[14px] font-semibold text-slate-900 mb-5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              Audit Trail
            </h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-5">
                {c.auditTrail.map((entry, i) => (
                  <div key={i} className="flex items-start gap-5 relative">
                    <div className="w-8 h-8 rounded-full bg-[--color-brand-50] border-2 border-[--color-brand-100] flex items-center justify-center shrink-0 z-10">
                      <span className="text-[10px] font-bold text-[--color-brand-900]">{i + 1}</span>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <FiUser className="w-3 h-3" />
                        {entry.actor}
                        <span>·</span>
                        <FiClock className="w-3 h-3" />
                        <span className="font-mono">{entry.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
