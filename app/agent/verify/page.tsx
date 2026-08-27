"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiCheckSquare,
  FiUser,
  FiHome,
  FiBriefcase,
  FiMapPin,
  FiCamera,
  FiCheckCircle,
  FiInfo,
  FiTrash2,
  FiClock,
  FiFileText,
  FiX,
  FiSearch,
  FiLayers,
  FiShoppingBag,
  FiAward,
} from "react-icons/fi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  VERIFICATION_PROFILES,
  VerificationProfileConfig,
} from "@/lib/verificationProfiles";
import DynamicVerificationForm from "@/components/verification/DynamicVerificationForm";

const CATEGORIES = ["All", "Residential", "Business", "Commercial", "DSA", "Property", "Asset"] as const;

export default function VerificationProcessPage() {
  const [selectedProfileCode, setSelectedProfileCode] = useState<string>("RESIDENTIAL");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittedForms, setSubmittedForms] = useState<any[]>([]);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load local history
    try {
      const stored = localStorage.getItem("lvms_submitted_verifications");
      if (stored) setSubmittedForms(JSON.parse(stored));
    } catch {
      // Ignore storage errors
    }
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Filter profiles based on category and search query
  const filteredProfiles = useMemo(() => {
    return VERIFICATION_PROFILES.filter((p) => {
      const matchCat =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeProfile = useMemo(() => {
    return (
      VERIFICATION_PROFILES.find((p) => p.code === selectedProfileCode) ||
      VERIFICATION_PROFILES[0]
    );
  }, [selectedProfileCode]);

  // Handle Form Submission
  const handleFormSubmit = async (data: {
    profileType: string;
    profileData: Record<string, any>;
    latitude: number;
    longitude: number;
    photos: { url: string; name: string }[];
  }) => {
    setIsSubmitting(true);
    try {
      // Simulate network request or offline caching
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newSubmission = {
        id: `SUB-${Date.now()}`,
        profileType: data.profileType,
        profileName: activeProfile.name,
        applicantName: data.profileData.applicantName || "Unknown Applicant",
        latitude: data.latitude,
        longitude: data.longitude,
        photosCount: data.photos.length,
        submittedAt: new Date().toISOString(),
        profileData: data.profileData,
      };

      const updated = [newSubmission, ...submittedForms];
      setSubmittedForms(updated);
      localStorage.setItem("lvms_submitted_verifications", JSON.stringify(updated));

      toast.success(`Verification Form submitted successfully: ${activeProfile.name}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FiCheckSquare className="w-6 h-6 text-blue-600" />
            Verification Process
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete standardized field questionnaire forms across 12 custom verification profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSubmittedModal(true)}
          className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-blue-900/40 flex items-center gap-2 transition self-start md:self-auto"
        >
          <FiFileText className="w-4 h-4" />
          View Submitted Forms ({submittedForms.length})
        </button>
      </div>

      {/* ─── Profile Selection Filter & Pills ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition",
                  selectedCategory === cat
                    ? "bg-[#1E3A5F] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 12 profiles..."
              className="h-8 pl-8 pr-3 w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Profile Tabs List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {filteredProfiles.map((p) => {
            const isSelected = p.code === selectedProfileCode;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => setSelectedProfileCode(p.code)}
                className={cn(
                  "p-2.5 rounded-xl text-left border transition flex flex-col justify-between gap-2 group relative overflow-hidden",
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-600 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {p.category}
                  </span>
                  {isSelected && (
                    <FiCheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                  {p.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Active Dynamic Form ─── */}
      <DynamicVerificationForm
        key={selectedProfileCode}
        profileCode={selectedProfileCode}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
      />

      {/* ─── Submitted Forms Modal ─── */}
      {showSubmittedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                Submitted Verification History ({submittedForms.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmittedModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {submittedForms.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No submitted forms recorded yet.
                </div>
              ) : (
                submittedForms.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800">
                          {item.profileType}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.applicantName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.profileName} · {item.photosCount} Photos · Lat:{" "}
                        {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(item.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700">
                        Submitted
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              {submittedForms.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Clear local submission history?")) {
                      setSubmittedForms([]);
                      localStorage.removeItem("lvms_submitted_verifications");
                    }
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear History
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSubmittedModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-200 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
