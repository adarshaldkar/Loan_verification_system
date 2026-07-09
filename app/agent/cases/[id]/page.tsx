"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  FiMapPin, FiPhone, FiNavigation, FiCheckCircle, FiPlayCircle,
  FiUser, FiBriefcase, FiChevronLeft, FiAlertTriangle, FiMail,
  FiArrowRight, FiMap,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAgentCaseDetailsApi, updateAgentCaseStatusApi } from "@/lib/api";

type CaseStatus = "PENDING" | "ASSIGNED" | "TRAVELLING" | "AT_LOCATION" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
type Priority = "High" | "Medium" | "Low";

interface Customer {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string;
  loanAmount: number;
  loanType: string;
  businessName: string | null;
  branch: string | null;
}

interface CaseItem {
  id: string;
  status: CaseStatus;
  type: string;
  branch: string | null;
  customerId: string;
  createdAt: string;
  customer: Customer;
  remarks: string | null;
  profileData: string | null;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:         { label: "Pending",     color: "#1E3A5F", bg: "#EEF2FF" },
  ASSIGNED:        { label: "Assigned",    color: "#1E3A5F", bg: "#EEF2FF" },
  TRAVELLING:      { label: "Travelling",  color: "#7C3AED", bg: "#EDE9FE" },
  AT_LOCATION:     { label: "At Location", color: "#0D9488", bg: "#CCFBF1" },
  IN_PROGRESS:     { label: "In Progress", color: "#D97706", bg: "#FEF3C7" },
  COMPLETED:       { label: "Completed",   color: "#0D9488", bg: "#CCFBF1" },
  REJECTED:        { label: "Rejected",    color: "#DC2626", bg: "#FEE2E2" },
};

export default function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [caseObj, setCaseObj] = useState<CaseItem | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      const res = await getAgentCaseDetailsApi(id);
      if (res.data.success) {
        setCaseObj(res.data.data);
      }
    } catch (err: any) {
      toast.error("Failed to load case details.");
      if (err.response?.status === 401) {
        router.push("/agent/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[#1E3A5F] animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Loading case details...</p>
      </div>
    );
  }

  if (!caseObj) {
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

  const { status, customer } = caseObj;
  const s = STATUS_STYLE[status] || STATUS_STYLE["PENDING"];

  const getPriority = (): Priority => {
    if (customer.loanAmount > 1000000) return "High";
    if (customer.loanAmount > 500000) return "Medium";
    return "Low";
  };

  const getLatitude = () => 12.9716;
  const getLongitude = () => 77.5946;

  // ── Action Handlers ──
  async function updateStatus(newStatus: CaseStatus) {
    try {
      const res = await updateAgentCaseStatusApi(id, newStatus);
      if (res.data.success) {
        setCaseObj(prev => prev ? { ...prev, status: newStatus } : null);
        return true;
      }
    } catch (err: any) {
      toast.error("Failed to update status: " + (err.response?.data?.message || err.message));
    }
    return false;
  }

  function handleCallCustomer() {
    if (customer.phone) {
      window.open(`tel:${customer.phone}`);
    } else {
      toast.error("Customer phone number not available.");
    }
  }

  async function handleStartNavigation() {
    if (status === "ASSIGNED" || status === "PENDING") {
      const success = await updateStatus("TRAVELLING");
      if (success) {
        setShowMap(true);
        toast.success("Navigation started. Case status: Travelling");
      }
    } else {
      setShowMap(true);
    }
  }

  async function handleArrived() {
    const success = await updateStatus("AT_LOCATION");
    if (success) {
      setShowMap(false);
      toast.success("Arrival confirmed! You can now start verification.");
    }
  }

  async function handleStartVerification() {
    const success = await updateStatus("IN_PROGRESS");
    if (success) {
      router.push(`/agent/verify/${id}`);
    }
  }

  const canNavigate    = ["PENDING", "ASSIGNED", "TRAVELLING", "AT_LOCATION", "IN_PROGRESS", "REJECTED"].includes(status);
  const canArrived     = status === "TRAVELLING";
  const canVerify      = status === "AT_LOCATION" || status === "IN_PROGRESS";
  const isReadOnly     = status === "COMPLETED" || status === "REJECTED";

  return (
    <div className="space-y-4 pb-24 text-slate-800">
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
            <p className="text-[11px] font-mono text-slate-400">{caseObj.id.slice(-12)}</p>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {customer.firstName} {customer.lastName}
            </h1>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full mt-1 uppercase"
            style={{ color: s.color, background: s.bg }}
          >
            {s.label}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="w-4 h-4 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-900">Customer Information</h2>
        </div>
        <div className="p-4 space-y-3 text-sm">
          {[
            { label: "Full Name",  value: `${customer.firstName} ${customer.lastName}`, icon: <FiUser className="w-3.5 h-3.5" /> },
            { label: "Phone",      value: customer.phone || "Not Available", icon: <FiPhone className="w-3.5 h-3.5" /> },
            { label: "Email",      value: customer.email || "Not Available", icon: <FiMail className="w-3.5 h-3.5" /> },
            { label: "Address",    value: customer.address,  icon: <FiMapPin className="w-3.5 h-3.5" /> },
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
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FiBriefcase className="w-4 h-4 text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-900">Loan & Case Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          {[
            { label: "Loan Type",         value: customer.loanType },
            { label: "Loan Amount",       value: `₹${customer.loanAmount.toLocaleString("en-IN")}` },
            { label: "Verification Type", value: caseObj.type === "RESIDENTIAL" ? "Residential" : "Business" },
            { label: "Branch",            value: caseObj.branch || customer.branch || "Not Set" },
            { label: "Priority",          value: getPriority() },
            { label: "Assigned On",       value: new Date(caseObj.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-[fadeIn_0.3s_ease]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiMap className="w-4 h-4 text-[#1E3A5F]" />
              <h2 className="text-[13px] font-semibold text-slate-900">Route to Customer</h2>
            </div>
            <span className="text-[10px] text-purple-700 bg-purple-50 font-semibold px-2 py-0.5 rounded-full">
              Travelling
            </span>
          </div>
          {/* Embedded Map */}
          <div className="relative">
            <iframe
              title="Customer Location"
              width="100%"
              height="240"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${getLatitude()},${getLongitude()}&z=15&output=embed`}
            />
          </div>
          <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-t border-slate-100">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs font-semibold text-slate-700 truncate">{customer.address}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Lat: {getLatitude()} · Lng: {getLongitude()}</p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${getLatitude()},${getLongitude()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-lg shrink-0"
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
              className="text-sm font-semibold px-4 py-2 rounded-xl inline-block"
              style={{ color: STATUS_STYLE[status]?.color, background: STATUS_STYLE[status]?.bg }}
            >
              {STATUS_STYLE[status]?.label} — Report Submitted Successfully
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
              <span>Start Verification</span>
              {canVerify && <FiArrowRight className="w-4 h-4 ml-1" />}
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
