"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  FiChevronLeft, FiUpload, FiCamera, FiCheckCircle, FiSave,
  FiHome, FiBriefcase, FiMapPin, FiX, FiAlertCircle,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Mock Case Type Resolver ────────────────────────────────────────────── */

const CASE_TYPES: Record<string, "RESIDENTIAL" | "BUSINESS"> = {
  "LV-2026-10821": "BUSINESS",
  "LV-2026-10819": "RESIDENTIAL",
  "LV-2026-10817": "RESIDENTIAL",
  "LV-2026-10814": "BUSINESS",
  "LV-2026-10813": "RESIDENTIAL",
  "LV-2026-10811": "BUSINESS",
  "LV-2026-10809": "RESIDENTIAL",
};

const CASE_CUSTOMERS: Record<string, string> = {
  "LV-2026-10821": "Priya Sharma",
  "LV-2026-10819": "Sandeep Yadav",
  "LV-2026-10817": "Rahul Gupta",
  "LV-2026-10814": "Arvind Patel",
  "LV-2026-10813": "Sunita Joshi",
  "LV-2026-10811": "Manoj Tiwari",
  "LV-2026-10809": "Deepa Nair",
};

/* ─── Shared Types ───────────────────────────────────────────────────────── */

type PhotoSlot = { label: string; required: boolean; captured: boolean; src?: string };

/* ─── Photo Capture Section ──────────────────────────────────────────────── */

function PhotoSection({
  slots,
  onCapture,
}: {
  slots: PhotoSlot[];
  onCapture: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
        <FiCamera className="w-4 h-4 text-[#1E3A5F]" /> Photographic Evidence
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => onCapture(i)}
            className={cn(
              "relative rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 text-center transition-all active:scale-95",
              slot.captured
                ? "border-teal-400 bg-teal-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            )}
          >
            {slot.captured ? (
              <FiCheckCircle className="w-6 h-6 text-teal-600" />
            ) : (
              <FiCamera className="w-6 h-6 text-slate-400" />
            )}
            <p className="text-[11px] font-medium leading-tight" style={{ color: slot.captured ? "#0D9488" : "#64748B" }}>
              {slot.label}
            </p>
            {slot.required && !slot.captured && (
              <span className="absolute top-1.5 right-1.5 text-[9px] bg-rose-100 text-rose-600 font-semibold px-1.5 rounded-full">
                Required
              </span>
            )}
            {slot.captured && (
              <span className="absolute top-1.5 right-1.5 text-[9px] bg-teal-100 text-teal-700 font-semibold px-1.5 rounded-full">
                ✓ Done
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 text-center">
        📍 Photos will be geo-tagged with GPS coordinates and timestamp automatically
      </p>
    </div>
  );
}

/* ─── Field Component ────────────────────────────────────────────────────── */

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all";
const selectClass = inputClass + " appearance-none";

/* ─── Residential Verification Form ──────────────────────────────────────── */

function ResidentialForm({
  onSave, onSubmit,
}: { onSave: () => void; onSubmit: () => void }) {
  const [form, setForm] = useState({
    addressMatch: "", residenceType: "", ownershipStatus: "",
    neighbourhoodConfirm: "", electricityConn: "", waterConn: "",
    yearsAtAddress: "", familyMembers: "", applicantPresent: "",
    remarks: "",
  });

  const [photos, setPhotos] = useState<PhotoSlot[]>([
    { label: "Front View of House",   required: true,  captured: false },
    { label: "House Number / Plate",  required: true,  captured: false },
    { label: "Street View",           required: true,  captured: false },
    { label: "Applicant Present",     required: false, captured: false },
    { label: "Electricity Meter",     required: false, captured: false },
    { label: "Additional Evidence",   required: false, captured: false },
  ]);

  function capturePhoto(i: number) {
    // Simulate photo capture with GPS tag
    const now = new Date().toLocaleTimeString();
    const gps = "19.018255, 72.847145";
    toast.success(`Photo captured at ${now} · GPS: ${gps}`);
    setPhotos((prev) => prev.map((p, idx) => idx === i ? { ...p, captured: true } : p));
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <Section title="Address Verification" icon={<FiMapPin className="w-4 h-4" />}>
        <Field label="Does address match documents?" required>
          <select className={selectClass} value={form.addressMatch} onChange={set("addressMatch")}>
            <option value="">Select…</option>
            <option value="yes">Yes — Matches exactly</option>
            <option value="partial">Partial match</option>
            <option value="no">No — Does not match</option>
          </select>
        </Field>
        <Field label="Residence Type" required>
          <select className={selectClass} value={form.residenceType} onChange={set("residenceType")}>
            <option value="">Select…</option>
            <option>Apartment / Flat</option>
            <option>Independent House</option>
            <option>Row House</option>
            <option>Chawl / Slum</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Ownership Status" required>
          <select className={selectClass} value={form.ownershipStatus} onChange={set("ownershipStatus")}>
            <option value="">Select…</option>
            <option>Owned</option>
            <option>Rented</option>
            <option>Family Owned</option>
            <option>Employer Provided</option>
          </select>
        </Field>
        <Field label="Neighbourhood Confirmed" required>
          <select className={selectClass} value={form.neighbourhoodConfirm} onChange={set("neighbourhoodConfirm")}>
            <option value="">Select…</option>
            <option value="yes">Yes — Neighbours confirm applicant lives here</option>
            <option value="no">No — Could not confirm</option>
          </select>
        </Field>
      </Section>

      <Section title="Utilities & Facilities" icon={<FiHome className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Electricity Connection" required>
            <select className={selectClass} value={form.electricityConn} onChange={set("electricityConn")}>
              <option value="">Select…</option>
              <option>Available</option>
              <option>Not Available</option>
            </select>
          </Field>
          <Field label="Water Connection" required>
            <select className={selectClass} value={form.waterConn} onChange={set("waterConn")}>
              <option value="">Select…</option>
              <option>Available</option>
              <option>Not Available</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years at Address">
            <input type="number" min={0} max={50} className={inputClass} placeholder="e.g. 5"
              value={form.yearsAtAddress} onChange={set("yearsAtAddress")} />
          </Field>
          <Field label="Family Members">
            <input type="number" min={1} max={20} className={inputClass} placeholder="e.g. 4"
              value={form.familyMembers} onChange={set("familyMembers")} />
          </Field>
        </div>
      </Section>

      <Section title="Applicant Information" icon={<FiCheckCircle className="w-4 h-4" />}>
        <Field label="Applicant Present During Visit?" required>
          <select className={selectClass} value={form.applicantPresent} onChange={set("applicantPresent")}>
            <option value="">Select…</option>
            <option value="yes">Yes — Applicant was present</option>
            <option value="no">No — Not available</option>
            <option value="neighbour">Met neighbour/relative instead</option>
          </select>
        </Field>
        <Field label="Remarks & Observations">
          <textarea
            className={inputClass + " resize-none"}
            rows={3}
            placeholder="Describe your observations…"
            value={form.remarks}
            onChange={set("remarks")}
          />
        </Field>
      </Section>

      {/* GPS info */}
      <div className="flex items-center gap-2.5 bg-teal-50 border border-teal-200 rounded-xl p-3">
        <FiMapPin className="w-4 h-4 text-teal-600 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-teal-700">GPS Coordinates Captured</p>
          <p className="text-[11px] text-teal-600">Lat: 19.018255 · Lng: 72.847145 · Accuracy: ±5m</p>
        </div>
      </div>

      <PhotoSection slots={photos} onCapture={capturePhoto} />

      {/* Action buttons */}
      <ActionButtons onSave={onSave} onSubmit={onSubmit} />
    </div>
  );
}

/* ─── Business Verification Form ─────────────────────────────────────────── */

function BusinessForm({
  onSave, onSubmit,
}: { onSave: () => void; onSubmit: () => void }) {
  const [form, setForm] = useState({
    businessName: "", businessType: "", ownershipStatus: "",
    operationalStatus: "", employeeCount: "", stockAvailability: "",
    gstAvailable: "", licenseAvailable: "", signboardAvailable: "",
    customerPresent: "", yearEstablished: "", remarks: "",
  });

  const [photos, setPhotos] = useState<PhotoSlot[]>([
    { label: "Business Signboard",    required: true,  captured: false },
    { label: "Front View of Premises", required: true,  captured: false },
    { label: "Street View",           required: true,  captured: false },
    { label: "Stock / Inventory",     required: false, captured: false },
    { label: "GST Certificate",       required: false, captured: false },
    { label: "Customer / Staff",      required: false, captured: false },
  ]);

  function capturePhoto(i: number) {
    const now = new Date().toLocaleTimeString();
    const gps = "19.018255, 72.847145";
    toast.success(`Photo captured at ${now} · GPS: ${gps}`);
    setPhotos((prev) => prev.map((p, idx) => idx === i ? { ...p, captured: true } : p));
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <Section title="Business Details" icon={<FiBriefcase className="w-4 h-4" />}>
        <Field label="Business Name (as seen on-site)" required>
          <input type="text" className={inputClass} placeholder="Enter business name"
            value={form.businessName} onChange={set("businessName")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Business Type" required>
            <select className={selectClass} value={form.businessType} onChange={set("businessType")}>
              <option value="">Select…</option>
              <option>Retail Shop</option>
              <option>Manufacturing</option>
              <option>Service Provider</option>
              <option>Wholesale</option>
              <option>Restaurant / Food</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Ownership Status" required>
            <select className={selectClass} value={form.ownershipStatus} onChange={set("ownershipStatus")}>
              <option value="">Select…</option>
              <option>Owned</option>
              <option>Rented</option>
              <option>Leased</option>
            </select>
          </Field>
        </div>
        <Field label="Year Established">
          <input type="number" min={1950} max={2026} className={inputClass} placeholder="e.g. 2018"
            value={form.yearEstablished} onChange={set("yearEstablished")} />
        </Field>
      </Section>

      <Section title="Operational Status" icon={<FiCheckCircle className="w-4 h-4" />}>
        <Field label="Is Business Operational?" required>
          <select className={selectClass} value={form.operationalStatus} onChange={set("operationalStatus")}>
            <option value="">Select…</option>
            <option value="active">Yes — Actively operational</option>
            <option value="partial">Partially operational</option>
            <option value="closed">Temporarily closed</option>
            <option value="shutdown">Permanently shut down</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Employee Count">
            <input type="number" min={0} className={inputClass} placeholder="e.g. 10"
              value={form.employeeCount} onChange={set("employeeCount")} />
          </Field>
          <Field label="Stock Available?" required>
            <select className={selectClass} value={form.stockAvailability} onChange={set("stockAvailability")}>
              <option value="">Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="na">N/A (Service)</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Compliance & Documentation" icon={<FiUpload className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="GST Certificate" required>
            <select className={selectClass} value={form.gstAvailable} onChange={set("gstAvailable")}>
              <option value="">Select…</option>
              <option value="yes">Available &amp; Verified</option>
              <option value="no">Not Available</option>
              <option value="expired">Expired</option>
            </select>
          </Field>
          <Field label="Trade License" required>
            <select className={selectClass} value={form.licenseAvailable} onChange={set("licenseAvailable")}>
              <option value="">Select…</option>
              <option value="yes">Available &amp; Verified</option>
              <option value="no">Not Available</option>
              <option value="expired">Expired</option>
            </select>
          </Field>
        </div>
        <Field label="Business Signboard Visible?" required>
          <select className={selectClass} value={form.signboardAvailable} onChange={set("signboardAvailable")}>
            <option value="">Select…</option>
            <option value="yes">Yes — Clearly visible</option>
            <option value="partial">Partially visible</option>
            <option value="no">No signboard</option>
          </select>
        </Field>
        <Field label="Customer / Staff Present During Visit?" required>
          <select className={selectClass} value={form.customerPresent} onChange={set("customerPresent")}>
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
      </Section>

      <Section title="Remarks" icon={<FiAlertCircle className="w-4 h-4" />}>
        <Field label="Observations & Remarks">
          <textarea
            className={inputClass + " resize-none"}
            rows={3}
            placeholder="Describe your observations, discrepancies, or additional notes…"
            value={form.remarks}
            onChange={set("remarks")}
          />
        </Field>
      </Section>

      {/* GPS info */}
      <div className="flex items-center gap-2.5 bg-teal-50 border border-teal-200 rounded-xl p-3">
        <FiMapPin className="w-4 h-4 text-teal-600 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-teal-700">GPS Coordinates Captured</p>
          <p className="text-[11px] text-teal-600">Lat: 19.018255 · Lng: 72.847145 · Accuracy: ±5m</p>
        </div>
      </div>

      <PhotoSection slots={photos} onCapture={capturePhoto} />
      <ActionButtons onSave={onSave} onSubmit={onSubmit} />
    </div>
  );
}

/* ─── Section Wrapper ────────────────────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="text-[#1E3A5F]">{icon}</span>
        <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

/* ─── Action Buttons ─────────────────────────────────────────────────────── */

function ActionButtons({ onSave, onSubmit }: { onSave: () => void; onSubmit: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
      <button
        onClick={onSave}
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-[#1E3A5F] text-[#1E3A5F] hover:bg-blue-50 transition-colors active:scale-95"
      >
        <FiSave className="w-4 h-4" /> Save Draft
      </button>
      <button
        onClick={onSubmit}
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
        style={{ background: "#1E3A5F" }}
      >
        <FiCheckCircle className="w-4 h-4" /> Submit
      </button>
    </div>
  );
}

/* ─── Verification Page ──────────────────────────────────────────────────── */

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const verType = CASE_TYPES[id] ?? "RESIDENTIAL";
  const customer = CASE_CUSTOMERS[id] ?? "Customer";

  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved]         = useState(false);

  function handleSave() {
    setSaved(true);
    toast.success("Draft saved. You can resume later.");
  }

  function handleSubmit() {
    // Simulate validation
    toast.loading("Validating and submitting…");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Verification submitted successfully! Admin has been notified.");
      setSubmitted(true);
    }, 1500);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
          <FiCheckCircle className="w-10 h-10 text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Verification Submitted!
        </h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Your verification report for <strong>{customer}</strong> has been submitted. The administrator will review it shortly.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 w-full max-w-sm text-left">
          <p className="text-xs font-semibold text-[#1E3A5F] mb-1">Case ID: {id}</p>
          <p className="text-xs text-slate-500">Status changed to <strong>Submitted</strong></p>
          <p className="text-xs text-slate-400 mt-1">Submitted at {new Date().toLocaleTimeString()}</p>
        </div>
        <button
          onClick={() => router.push("/agent")}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#1E3A5F" }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/agent/cases/${id}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <FiChevronLeft className="w-4 h-4" /> Case Details
        </button>

        {/* Form type badge */}
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold mb-3",
          verType === "RESIDENTIAL" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
        )}>
          {verType === "RESIDENTIAL" ? <FiHome className="w-4 h-4" /> : <FiBriefcase className="w-4 h-4" />}
          {verType === "RESIDENTIAL" ? "Residential Verification Form" : "Business Verification Form"}
        </div>

        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          {customer}
        </h1>
        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{id}</p>

        {saved && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
            <FiSave className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs text-amber-700 font-medium">Draft saved — complete and submit when ready</p>
          </div>
        )}
      </div>

      {/* Render the right form */}
      {verType === "RESIDENTIAL" ? (
        <ResidentialForm onSave={handleSave} onSubmit={handleSubmit} />
      ) : (
        <BusinessForm onSave={handleSave} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
