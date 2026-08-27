"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiInfo,
  FiMapPin,
  FiUser,
  FiLayers,
} from "react-icons/fi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentCaseByIdApi, submitVerificationApi } from "@/lib/api";
import {
  VERIFICATION_PROFILES,
  getProfileByCode,
} from "@/lib/verificationProfiles";
import DynamicVerificationForm from "@/components/verification/DynamicVerificationForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CaseVerificationFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentCase, setCurrentCase] = useState<any | null>(null);
  const [selectedProfileCode, setSelectedProfileCode] = useState<string>("RESIDENTIAL");

  // Fetch Case Data
  useEffect(() => {
    async function loadCase() {
      try {
        setLoading(true);
        const res = await getAgentCaseByIdApi(caseId);
        const responseData = res.data;
        if (responseData?.success && responseData?.data) {
          const c = responseData.data;
          setCurrentCase(c);
          // Set initial profile code matching case type
          const detectedProfile = getProfileByCode(c.type || "RESIDENTIAL");
          setSelectedProfileCode(detectedProfile.code);
        } else {
          toast.error("Case not found or unauthorized");
          router.push("/agent/cases");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load case details");
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [caseId, router]);

  const activeProfile = useMemo(
    () => getProfileByCode(selectedProfileCode),
    [selectedProfileCode]
  );

  // Handle Form Submission for this specific case
  const handleSubmitCase = async (data: {
    profileType: string;
    profileData: Record<string, any>;
    latitude: number;
    longitude: number;
    photos: { url: string; name: string }[];
  }) => {
    setSubmitting(true);
    try {
      const payload = {
        type: data.profileType,
        profileData: data.profileData,
        latitude: data.latitude,
        longitude: data.longitude,
        photos: data.photos.map((p) => p.url),
      };

      const res = await submitVerificationApi(caseId, payload);
      if (res.data?.success) {
        toast.success(
          `Case #${currentCase?.customer?.applicationId || currentCase?.applicationId || caseId.slice(0, 8)} submitted for admin review!`
        );
        router.push("/agent/cases");
      } else {
        toast.error(res.data?.message || "Failed to submit verification");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-500">Case details unavailable.</p>
        <button
          onClick={() => router.push("/agent/cases")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* ─── Top Nav Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/agent/cases")}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50 transition"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                {currentCase.customer?.applicationId || currentCase.applicationId || "CASE"}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Verify {currentCase.customer?.name || currentCase.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentCase.customer?.address || currentCase.address} · Phone:{" "}
              {currentCase.customer?.phone || currentCase.phone}
            </p>
          </div>
        </div>

        {/* Profile Switcher Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 pl-2 font-medium">Form Type:</span>
          <Select
            value={selectedProfileCode}
            onValueChange={(val) => val && setSelectedProfileCode(val)}
          >
            <SelectTrigger className="h-8 text-xs font-semibold w-[240px] bg-slate-50 dark:bg-slate-800 border-0">
              <SelectValue placeholder="Select Profile Form" />
            </SelectTrigger>
            <SelectContent>
              {VERIFICATION_PROFILES.map((p) => (
                <SelectItem key={p.code} value={p.code} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">[{p.category}]</span>
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Render Dynamic Form with Pre-Filled Props ─── */}
      <DynamicVerificationForm
        key={`${caseId}_${selectedProfileCode}`}
        profileCode={selectedProfileCode}
        caseId={caseId}
        applicantDefaultName={currentCase.customer?.name || currentCase.name}
        applicantDefaultPhone={currentCase.customer?.phone || currentCase.phone}
        applicantDefaultAddress={currentCase.customer?.address || currentCase.address}
        initialData={currentCase.profileData ? JSON.parse(currentCase.profileData) : {}}
        isSubmitting={submitting}
        onSubmit={handleSubmitCase}
      />
    </div>
  );
}