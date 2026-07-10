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
import { getAgentCaseByIdApi, updateAgentCaseStatusApi } from "@/lib/api";

type CaseStatus = "ASSIGNED" | "PENDING" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" | "REJECTED";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED:    { label: "Assigned",    color: "#1E3A5F", bg: "#EEF2FF" },
  PENDING:     { label: "Pending",     color: "#B45309", bg: "#FEF3C7" },
  TRAVELLING:  { label: "Travelling",  color: "#7C3AED", bg: "#EDE9FE" },
  AT_LOCATION: { label: "At Location", color: "#0D9488", bg: "#CCFBF1" },
  IN_PROGRESS: { label: "In Progress", color: "#D97706", bg: "#FEF3C7" },
  SUBMITTED:   { label: "Submitted",   color: "#2563EB", bg: "#DBEAFE" },
  COMPLETED:   { label: "Completed",   color: "#15803D", bg: "#DCFCE7" },
  REJECTED:    { label: "Rejected",    color: "#B91C1C", bg: "#FEE2E2" },
};

export default function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<CaseStatus>("ASSIGNED");
  const [showMap, setShowMap] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    getAgentCaseByIdApi(id)
      .then((res) => {
        setCaseData(res.data.data);
        setStatus(res.data.data.status);
      })
      .catch((err) => {
        toast.error("Failed to load case details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-[#1E3A5F]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="40" strokeDashoffset="10" />
        </svg>
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

  const s = STATUS_STYLE[status] || STATUS_STYLE.ASSIGNED;

  // ── Action handlers ──
  function handleCallCustomer() {
    window.open(`tel:${caseData.customer.phone}`);
  }

  function handleStartNavigation() {
    if (status === "ASSIGNED" || status === "PENDING") {
      setStatus("TRAVELLING");
      setShowMap(true);
      toast.success("Navigation started. Case status: Travelling");
    } else {
      setShowMap(true);
    }
  }

  function handleArrived() {
    setStatus("AT_LOCATION");
    setShowMap(false);
    toast.success("Arrival confirmed! You can now start verification.");
  }

  async function handleStartVerification() {
    // If the case is not yet IN_PROGRESS in DB, update it
    if (caseData.status !== "IN_PROGRESS" && caseData.status !== "SUBMITTED" && caseData.status !== "COMPLETED") {
      setIsUpdating(true);
      try {
        await updateAgentCaseStatusApi(id, "IN_PROGRESS");
        setStatus("IN_PROGRESS");
        router.push(`/agent/verify/${id}`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to start verification");
      } finally {
        setIsUpdating(false);
      }
    } else {
      router.push(`/agent/verify/${id}`);
    }
  }

  const canNavigate    = ["ASSIGNED", "PENDING", "TRAVELLING", "AT_LOCATION", "IN_PROGRESS", "SUBMITTED", "REJECTED"].includes(status);
  const canArrived     = status === "TRAVELLING";
  const canVerify      = status === "AT_LOCATION" || status === "IN_PROGRESS" || status === "REJECTED";
  const isReadOnly     = status === "SUBMITTED" || status === "COMPLETED";

  // Dummy coordinates if GPS is null
  const lat = caseData.gpsLatitude || 19.0760;
  const lng = caseData.gpsLongitude || 72.8777;

  return (
    <div className="space-y-4 pb-24">
      {/* Back + Title */}
      <div>
        <button
          onClick={() => router.push("/agent/cases")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" /> Assigned Cases
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono text-slate-400">{caseData.id}</p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {caseData.customer.name}
            </h1>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full mt-1 whitespace-nowrap ml-2"
            style={{ color: s.color, background: s.bg }}
          >
            {s.label}
          </span>
        </div>
      </div>

      {/* Rejected alert (acts like re-verification) */}
      {status === "REJECTED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Re-verification Required (Rejected)</p>
            <p className="text-xs text-rose-600 mt-0.5">This case was rejected. Please review and start verification again.</p>
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-900">Customer Information</h2>
        </div>
        <div className="p-4 space-y-3 text-sm">
          {[
            { label: "Full Name",  value: caseData.customer.name, icon: <FiUser className="w-3.5 h-3.5" /> },
            { label: "Phone",      value: caseData.customer.phone || 'N/A',    icon: <FiPhone className="w-3.5 h-3.5" /> },
            { label: "Email",      value: caseData.customer.email || 'N/A',    icon: <FiMail className="w-3.5 h-3.5" /> },
            { label: "Address",    value: caseData.customer.address,  icon: <FiMapPin className="w-3.5 h-3.5" /> },
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
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiBriefcase className="w-4 h-4 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-900">Loan & Case Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          {[
            { label: "Loan Type",         value: caseData.customer.loanType || 'N/A' },
            { label: "Loan Amount",       value: caseData.customer.loanAmount ? `₹${caseData.customer.loanAmount.toLocaleString()}` : 'N/A' },
            { label: "Verification Type", value: caseData.type === "RESIDENTIAL" ? "Residential" : "Business" },
            { label: "Branch",            value: caseData.branch || 'Unassigned' },
            { label: "Priority",          value: caseData.status === 'PENDING' ? 'High' : 'Medium' },
            { label: "Assigned On",       value: caseData.assignedOn },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white p-3">
              <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
              <p className="text-[13px] font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      {showMap && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiMap className="w-4 h-4 text-[#1E3A5F]" />
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
              src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            />
          </div>
          <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
            <div>
              <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{caseData.customer.address}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Lat: {lat} · Lng: {lng}</p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shrink-0"
              style={{ background: "#1E3A5F" }}
            >
              <FiNavigation className="w-3 h-3" /> Open Maps
            </a>
          </div>
        </div>
      )}

      {/* ── Sticky Action Buttons ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 z-40 shadow-lg lg:max-w-3xl lg:mx-auto">
        {isReadOnly ? (
          <div className="text-center py-2">
            <span
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ color: STATUS_STYLE[status]?.color, background: STATUS_STYLE[status]?.bg }}
            >
              {STATUS_STYLE[status]?.label} — No further action needed
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Call + Navigate row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCallCustomer}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-blue-50 transition-colors active:scale-95"
              >
                <FiPhone className="w-4 h-4" /> Call
              </button>
              <button
                onClick={handleStartNavigation}
                disabled={!canNavigate}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors active:scale-95 disabled:opacity-40"
                style={{ background: "#7C3AED" }}
              >
                <FiNavigation className="w-4 h-4" />
                {status === "TRAVELLING" ? "View Route" : "Navigate"}
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
              disabled={!canVerify || isUpdating}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95",
                (!canVerify || isUpdating) && "opacity-40 cursor-not-allowed"
              )}
              style={{ background: canVerify ? "#1E3A5F" : "#94A3B8" }}
            >
              {isUpdating ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="40" strokeDashoffset="10" />
                </svg>
              ) : (
                <FiPlayCircle className="w-4.5 h-4.5" />
              )}
              {status === "REJECTED" ? "Re-start Verification" : "Start Verification"}
              {canVerify && !isUpdating && <FiArrowRight className="w-4 h-4 ml-1" />}
            </button>

            {!canVerify && (status === "ASSIGNED" || status === "PENDING") && (
              <p className="text-center text-[11px] text-slate-400">
                ⚠️ Navigate to the location first, then confirm arrival to unlock verification
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
