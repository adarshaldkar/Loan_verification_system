"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  FiMapPin, FiPhone, FiNavigation, FiCheckCircle, FiPlayCircle,
  FiUser, FiBriefcase, FiChevronLeft, FiAlertTriangle, FiMail,
  FiArrowRight, FiMap,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgentCaseByIdApi, updateAgentCaseStatusApi } from "@/lib/api";
import { STATUS_COLORS } from "@/lib/constants";

type CaseStatus = "ASSIGNED" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "RE_VERIFICATION";

export default function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [status, setStatus]     = useState<CaseStatus>("ASSIGNED");
  const [showMap, setShowMap]   = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getAgentCaseByIdApi(id);
        const fetched = res.data.data;
        // Map database fields to front-end schema
        setCaseData({
          id: fetched.id,
          customer: fetched.customer?.name || "Unknown",
          phone: fetched.customer?.phone || "N/A",
          email: fetched.customer?.email || "N/A",
          address: fetched.customer?.address || "No address provided",
          lat: fetched.gpsLatitude || 12.9716,
          lng: fetched.gpsLongitude || 77.5946,
          loanType: fetched.customer?.loanType || "Verification Loan",
          loanAmount: fetched.customer?.loanAmount ? `₹${fetched.customer.loanAmount.toLocaleString()}` : "N/A",
          verType: fetched.type,
          branch: fetched.branch || "Unassigned",
          priority: "Medium",
          assignedOn: fetched.assignedOn,
          status: fetched.status,
          agentNote: fetched.remarks
        });
        setStatus(fetched.status);
      } catch (err: any) {
        console.error("Error loading case details via API:", err);
        toast.error("Failed to load case data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Action card skeleton */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Client details block skeleton */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FiBriefcase className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">Case not found</p>
        <button onClick={() => router.push("/agent/cases")} className="mt-4 text-sm font-medium" style={{ color: "#1E3A5F" }}>
          ← Back to Cases
        </button>
      </div>
    );
  }

  const s = STATUS_COLORS[status] || { label: status, color: "#1E3A5F", bg: "#EEF2FF" };

  // ── Action handlers ──
  function handleCallCustomer() {
    window.open(`tel:${caseData.phone}`);
  }

  async function handleStartNavigation() {
    if (status === "ASSIGNED") {
      try {
        await updateAgentCaseStatusApi(id, "TRAVELLING");
        setStatus("TRAVELLING");
      } catch (err) {
        console.error("Failed to update status on API:", err);
      }
      setShowMap(true);
      toast.success("Navigation started. Case status: Travelling.");
    } else {
      setShowMap(true);
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${caseData.lat},${caseData.lng}`, "_blank");
  }

  async function handleArrived() {
    try {
      await updateAgentCaseStatusApi(id, "AT_LOCATION");
      setStatus("AT_LOCATION");
      setShowMap(false);
      toast.success("Arrival confirmed! You can now start verification.");
    } catch (err) {
      console.error("Failed to update status on API:", err);
      toast.error("Failed to update status");
    }
  }

  async function handleStartVerification() {
    try {
      await updateAgentCaseStatusApi(id, "IN_PROGRESS");
      setStatus("IN_PROGRESS");
    } catch (err) {
      console.error("Failed to update status on API:", err);
    }
    router.push(`/agent/verify/${id}`);
  }

  const canNavigate    = ["PENDING", "ASSIGNED", "TRAVELLING", "AT_LOCATION", "IN_PROGRESS", "SUBMITTED", "RE_VERIFICATION"].includes(status);
  const canArrived     = status === "TRAVELLING";
  const canVerify      = true;
  const isReadOnly     = status === "SUBMITTED" || status === "COMPLETED";

  return (
    <div className="space-y-4 pb-24 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      {/* Back + Title */}
      <div>
        <button
          onClick={() => router.push("/agent/cases")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" /> Assigned Cases
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono text-slate-400">{caseData.id}</p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {caseData.customer}
            </h1>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full mt-1"
            style={{ color: s.color, background: s.bg }}
          >
            {s.label}
          </span>
        </div>
      </div>

      {/* Re-verification alert */}
      {status === "RE_VERIFICATION" && caseData.agentNote && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Re-verification Required</p>
            <p className="text-xs text-rose-600 mt-0.5">{caseData.agentNote}</p>
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-900">Customer Information</h2>
        </div>
        <div className="p-4 space-y-3 text-sm">
          {[
            { label: "Full Name",  value: caseData.customer, icon: <FiUser className="w-3.5 h-3.5" /> },
            { label: "Phone",      value: caseData.phone,    icon: <FiPhone className="w-3.5 h-3.5" /> },
            { label: "Email",      value: caseData.email,    icon: <FiMail className="w-3.5 h-3.5" /> },
            { label: "Address",    value: caseData.address,  icon: <FiMapPin className="w-3.5 h-3.5" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="text-slate-400 mt-0.5">{icon}</span>
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                <p className="text-slate-800 font-medium text-[13px]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loan & Case Info */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiBriefcase className="w-4 h-4 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-900">Loan & Case Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          {[
            { label: "Loan Type",         value: caseData.loanType },
            { label: "Loan Amount",       value: caseData.loanAmount },
            { label: "Priority",          value: caseData.priority },
            { label: "Assigned On",       value: caseData.assignedOn },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-slate-950 p-4">
              <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
              <p className="text-slate-800 font-semibold text-[13px]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Card */}
      {showMap && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-purple-500" />
              <h2 className="text-[13px] font-semibold text-slate-900">Route to Customer</h2>
            </div>
            <span className="text-[10px] text-purple-700 bg-purple-50 font-semibold px-2 py-0.5 rounded-full">
              Travelling
            </span>
          </div>
          {/* Embedded Google Maps */}
          <div className="relative">
            <iframe
              title="Customer Location"
              width="100%"
              height="240"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${caseData.lat},${caseData.lng}&z=15&output=embed`}
            />
          </div>
          <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
            <div>
              <p className="text-xs font-medium text-slate-700">{caseData.address}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Lat: {caseData.lat} · Lng: {caseData.lng}</p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${caseData.lat},${caseData.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
              style={{ background: "#1E3A5F" }}
            >
              <FiNavigation className="w-3 h-3" /> Open Maps
            </a>
          </div>
        </div>
      )}

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-100 px-4 py-3 z-40 shadow-lg lg:max-w-3xl lg:mx-auto">
        {isReadOnly ? (
          <div className="text-center py-2">
            <span
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ color: (STATUS_COLORS[status] || STATUS_COLORS.COMPLETED).color, background: (STATUS_COLORS[status] || STATUS_COLORS.COMPLETED).bg }}
            >
              {(STATUS_COLORS[status] || STATUS_COLORS.COMPLETED).label} — No further action needed
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Call + Navigate row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCallCustomer}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-slate-200 hover:bg-slate-50 transition-colors active:scale-95"
              >
                <FiPhone className="w-4 h-4" /> Call Customer
              </button>
              <button
                onClick={handleStartNavigation}
                disabled={!canNavigate}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors active:scale-95 disabled:opacity-40"
                style={{ background: "#7C3AED" }}
              >
                <FiNavigation className="w-4 h-4" />
                {status === "TRAVELLING" ? "View Route" : "Start Navigation"}
              </button>
            </div>

            {/* Arrived button */}
            {canArrived && (
              <button
                onClick={handleArrived}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: "#0D9488" }}
              >
                <FiCheckCircle className="w-4.5 h-4.5" /> I Have Arrived
              </button>
            )}

            {/* Start Verification */}
            <button
              onClick={handleStartVerification}
              disabled={!canVerify}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95",
                !canVerify && "opacity-40 cursor-not-allowed"
              )}
              style={{ background: canVerify ? "#1E3A5F" : "#94A3B8" }}
            >
              <FiPlayCircle className="w-4.5 h-4.5" />
              {status === "RE_VERIFICATION" ? "Re-start Verification" : "Start Verification"}
              {canVerify && <FiArrowRight className="w-4 h-4 ml-1" />}
            </button>

            {status === "ASSIGNED" && (
              <p className="text-center text-[11px] text-slate-400">
                💡 Tip: You can navigate to location or start verification directly.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
