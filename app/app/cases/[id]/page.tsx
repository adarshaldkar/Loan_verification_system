"use client";

import { use, useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Mock Case Data (Removed) ───────────────────────────────────────────── */

/* ─── Field Row ──────────────────────────────────────────────────────────── */

function FieldRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-slate-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right flex-1">{value}</span>
    </div>
  );
}

/* ─── Geo Photo Card ─────────────────────────────────────────────────────── */

function GeoPhotoCard({ url, lat, lng }: { url: string, lat?: string, lng?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border relative group">
      <img src={url} alt="Evidence" className="w-full h-40 object-cover" />
      {(lat || lng) && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2 text-[10px] text-white font-mono flex justify-between items-center">
          <span>{lat && lng ? `${lat}, ${lng}` : 'GPS Unavailable'}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Case Detail Page ───────────────────────────────────────────────────── */

import { getCaseByIdAdminApi, updateCaseStatusApi } from "@/lib/api";
import { toast } from "sonner";

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCaseByIdAdminApi(id)
      .then((res) => setC(res.data.data))
      .catch((err) => toast.error("Failed to load case"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: "COMPLETED" | "REJECTED") => {
    try {
      await updateCaseStatusApi(id, newStatus);
      setC((prev: any) => ({ ...prev, status: newStatus === "COMPLETED" ? "Completed" : "Rejected" }));
      toast.success(`Case ${newStatus === "COMPLETED" ? "Approved" : "Rejected"}`);
    } catch (e: any) {
      toast.error(`Failed to update status`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  if (!c) {
    return <div className="p-5 text-center text-gray-500">Case not found.</div>;
  }

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
          <Button size="sm" className="gap-1.5 text-xs bg-rose-700 hover:bg-rose-800 text-white" onClick={() => handleStatusChange("REJECTED")}>
            <FiAlertTriangle className="w-3.5 h-3.5" />
            Reject
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-[--color-status-completed] hover:opacity-90 text-white" onClick={() => handleStatusChange("COMPLETED")}>
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
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Verification Fields */}
            <div className="card-flat p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiHome className="w-4 h-4 text-[--color-brand-900]" />
                <h3 className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                  {c.type} Verification
                </h3>
              </div>
              {c.profileData ? (
                Object.entries(c.profileData).filter(([k]) => k !== 'remarks').map(([key, val]) => {
                  let displayValue = String(val);
                  if (Array.isArray(val)) {
                    displayValue = `${val.length} item(s)`;
                  } else if (typeof val === 'object' && val !== null) {
                    displayValue = Object.entries(val)
                      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").trim()}: ${v}`)
                      .join(", ");
                  }
                  return (
                    <FieldRow
                      key={key}
                      label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      value={displayValue}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No profile data submitted yet.</p>
              )}
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
                    <p className="font-mono font-semibold text-slate-900 text-xs">{c.gps?.lat || "N/A"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 mb-1">LONGITUDE</p>
                    <p className="font-mono font-semibold text-slate-900 text-xs">{c.gps?.lng || "N/A"}</p>
                  </div>
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
              Geo-tagged Evidence
            </h3>
            {c.media && c.media.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.media.map((m: any, i: number) => (
                  <GeoPhotoCard key={m.id} url={m.url} lat={c.gps?.lat} lng={c.gps?.lng} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No photos uploaded.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
