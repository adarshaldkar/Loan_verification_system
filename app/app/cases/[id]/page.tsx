"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
  FiDownload,
  FiMapPin,
  FiClock,
  FiUser,
  FiHome,
  FiBriefcase,
  FiCamera,
} from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getCaseByIdAdminApi, updateCaseStatusApi } from "@/lib/api";
import { toast } from "sonner";
import { getProfileByCode } from "@/lib/verificationProfiles";
import StructuredProfileReview from "@/components/verification/StructuredProfileReview";

function GeoPhotoCard({ url, lat, lng }: { url: string; lat?: string; lng?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border relative group">
      <img src={url} alt="Evidence" className="w-full h-44 object-cover" />
      {(lat || lng) && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2 text-[10px] text-white font-mono flex justify-between items-center">
          <span>{lat && lng ? `${lat}, ${lng}` : "GPS Unavailable"}</span>
        </div>
      )}
    </div>
  );
}

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
      .catch(() => toast.error("Failed to load case"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: "COMPLETED" | "REJECTED") => {
    try {
      await updateCaseStatusApi(id, newStatus);
      setC((prev: any) => ({
        ...prev,
        status: newStatus === "COMPLETED" ? "Completed" : "Rejected",
      }));
      toast.success(`Case ${newStatus === "COMPLETED" ? "Approved" : "Rejected"}`);
    } catch {
      toast.error(`Failed to update status`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!c) {
    return <div className="p-5 text-center text-gray-500">Case not found.</div>;
  }

  const profileConfig = getProfileByCode(c.type || "RESIDENTIAL");
  const parsedProfileData =
    typeof c.profileData === "string" ? JSON.parse(c.profileData) : c.profileData;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/cases">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <FiArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {c.customer?.name || c.name || "Customer Case"}
            </h1>
            <span
              className={cn(
                "px-2.5 py-0.5 text-xs font-semibold rounded-full border",
                profileConfig.badgeColor
              )}
            >
              {profileConfig.name}
            </span>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {c.customer?.applicationId || c.applicationId} · {c.customer?.phone || c.phone}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {c.status !== "Completed" && c.status !== "APPROVED" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              onClick={() => handleStatusChange("COMPLETED")}
            >
              <FiCheckCircle className="w-3.5 h-3.5" /> Approve Case
            </Button>
          )}
          {c.status !== "Rejected" && c.status !== "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1.5"
              onClick={() => handleStatusChange("REJECTED")}
            >
              <FiAlertTriangle className="w-3.5 h-3.5" /> Reject Case
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="details">Questionnaire & Details</TabsTrigger>
          <TabsTrigger value="photos">Photos & GPS ({c.media?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Responses */}
            <div className="lg:col-span-2">
              <StructuredProfileReview
                profileType={c.type}
                profileData={parsedProfileData}
              />
            </div>

            {/* Right Col: GPS & Agent Remarks */}
            <div className="space-y-6">
              {/* GPS Info */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <FiMapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    GPS Location
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold mb-0.5">LATITUDE</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.gps?.lat || c.geoTag?.latitude || "N/A"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold mb-0.5">LONGITUDE</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.gps?.lng || c.geoTag?.longitude || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent & Branch */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <FiUser className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Field Agent Context
                  </h3>
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agent:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.agent?.firstName
                        ? `${c.agent.firstName} ${c.agent.lastName || ""}`
                        : c.agent?.name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.branch || "Headquarters"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Submitted:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.submittedAt || c.completedAt || "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Geo-tagged Evidence Photos
            </h3>
            {c.media && c.media.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.media.map((m: any) => (
                  <GeoPhotoCard
                    key={m.id}
                    url={m.url}
                    lat={c.gps?.lat || c.geoTag?.latitude}
                    lng={c.gps?.lng || c.geoTag?.longitude}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                No evidence photos uploaded for this case.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
