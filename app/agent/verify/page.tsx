"use client";

import { useState } from "react";
import { z } from "zod";
import {
  FiCheckSquare, FiUser, FiHome, FiBriefcase, FiMapPin, FiCamera, FiPlus,
  FiCalendar, FiEye, FiCheckCircle, FiInfo, FiTrash2, FiClock, FiFileText, FiX
} from "react-icons/fi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Zod Schemas ─── */

const residentialSchema = z.object({
  applicantName: z.string().min(2, "Applicant name must be at least 2 characters"),
  mobileNumber: z.string().regex(/^\+?[0-9]{10,12}$/, "Invalid mobile number (10-12 digits)"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, "Aadhaar number must be exactly 12 digits"),
  houseNo: z.string().min(1, "House/Door number is required"),
  streetArea: z.string().min(2, "Street/Area is required"),
  cityTown: z.string().min(2, "City/Town is required"),
  district: z.string().min(1, "District selection is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  residenceType: z.string().min(1, "Residence type selection is required"),
  ownershipStatus: z.string().min(1, "Ownership status selection is required"),
  livingSince: z.string().min(1, "Living since date is required"),
  familyMembers: z.coerce.number().min(1, "Family members must be at least 1"),
  monthlyRent: z.coerce.number().optional(),
  contactNeighbor: z.string().min(2, "Neighbor contact reference name is required"),
  addressFoundMatch: z.string().min(1, "Address found match selection is required"),
  neighborConfirm: z.string().min(1, "Neighbor confirmation selection is required"),
  electricityConnection: z.string().min(1, "Electricity connection selection is required"),
  waterConnection: z.string().min(1, "Water connection selection is required"),
  residenceCondition: z.string().min(1, "Residence condition selection is required"),
  remarks: z.string().max(300, "Remarks cannot exceed 300 characters").optional(),
});

const businessSchema = z.object({
  companyName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.string().min(1, "Business type selection is required"),
  natureOfBusiness: z.string().min(2, "Nature of business is required"),
  yearsInBusiness: z.coerce.number().min(0, "Years in business cannot be negative"),
  noOfEmployees: z.coerce.number().min(0, "Number of employees cannot be negative"),
  monthlyIncome: z.coerce.number().min(1, "Monthly income is required"),
  doorNo: z.string().min(1, "Door/Shop number is required"),
  streetArea: z.string().min(2, "Street/Area is required"),
  landmark: z.string().optional(),
  cityTown: z.string().min(2, "City/Town is required"),
  district: z.string().min(1, "District selection is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  businessFoundAtLocation: z.string().min(1, "Business location verification selection is required"),
  businessOperational: z.string().min(1, "Business operational state is required"),
  businessOwnedByApplicant: z.string().min(1, "Ownership verification is required"),
  businessPremisesType: z.string().min(1, "Premises type is required"),
  stockInventoryAvailable: z.string().min(1, "Stock level status is required"),
  gstLicenseAvailable: z.string().min(1, "GST/License check is required"),
  signboardAvailable: z.string().min(1, "Signboard status is required"),
  customerPresence: z.string().min(1, "Customer presence status is required"),
  documentsVerified: z.string().min(1, "Document verification status is required"),
  remarks: z.string().max(300, "Remarks cannot exceed 300 characters").optional(),
});

type ResidentialFormType = z.infer<typeof residentialSchema>;
type BusinessFormType = z.infer<typeof businessSchema>;

/* ─── Dropdown Options ─── */
const DISTRICT_OPTIONS = ["Tiruchirappalli", "Chennai", "Coimbatore", "Pondicherry", "Madurai", "Salem"];
const RESIDENCE_TYPES = ["Apartment / Flat", "Independent House", "Row House", "Villa", "Chawl / Slum"];
const OWNERSHIP_STATUSES = ["Owned", "Rented", "Leased", "Family Owned"];
const ADDRESS_MATCH_OPTIONS = ["Yes - Matches Exactly", "Partial Match", "No - Different Address"];
const NEIGHBOR_CONFIRMS = ["Confirmed", "Refused to Confirm", "Neighbor Unavailable"];
const ELECTRIC_CONNECTIONS = ["Regular Connection", "No Connection", "Disconnected / Inactive"];
const WATER_CONNECTIONS = ["Corporation Water", "Borewell / Well", "No Water Supply"];
const RESIDENCE_CONDITIONS = ["Excellent", "Good / Satisfactory", "Dilapidated / Poor"];

const BUSINESS_TYPES = ["Proprietorship", "Partnership", "Private Limited", "LLP", "Unregistered"];
const BUSINESS_FOUND_OPTIONS = ["Yes - Active Shop/Office", "No - Closed/Shut Down", "Wrong Address"];
const OPERATIONAL_OPTIONS = ["Yes - Fully Operational", "Partially Operational", "Non-Operational"];
const OWNED_BY_APPLICANT_OPTIONS = ["Yes - Owner", "No - Employee/Staff", "Leased"];
const PREMISES_TYPES = ["Commercial Shop", "Office Building", "Industrial Shed", "Home Office"];
const STOCK_OPTIONS = ["High / Abundant Stock", "Moderate / Adequate", "Low / Empty"];
const GST_LICENSE_OPTIONS = ["Yes - Valid License", "No License Found", "Expired License"];
const SIGNBOARD_OPTIONS = ["Yes - Board Displayed", "No Signboard", "Wrong Board Name"];
const CLIENT_PRESENCE_OPTIONS = ["Yes - Met Client", "Met Staff Only", "Client Not Available"];
const DOCUMENTS_VERIFIED_OPTIONS = ["Yes - All Documents Valid", "Partial Verification", "No Documents Produced"];

export default function VerificationProcessPage() {
  const [activeTab, setActiveTab] = useState<"residential" | "business">("residential");
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedForms, setSubmittedForms] = useState<any[]>([]);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);

  // Form states
  const [resForm, setResForm] = useState<Partial<ResidentialFormType>>({
    applicantName: "", mobileNumber: "", dateOfBirth: "", aadhaarNumber: "",
    houseNo: "", streetArea: "", cityTown: "", district: "Tiruchirappalli", pincode: "",
    residenceType: "Apartment / Flat", ownershipStatus: "Owned", livingSince: "",
    familyMembers: 1, monthlyRent: 0, contactNeighbor: "", addressFoundMatch: "Yes - Matches Exactly",
    neighborConfirm: "Confirmed", electricityConnection: "Regular Connection",
    waterConnection: "Corporation Water", residenceCondition: "Excellent", remarks: "",
  });

  const [busForm, setBusForm] = useState<Partial<BusinessFormType>>({
    companyName: "", businessType: "Proprietorship", natureOfBusiness: "", yearsInBusiness: 1,
    noOfEmployees: 1, monthlyIncome: 10000, doorNo: "", streetArea: "", landmark: "",
    cityTown: "", district: "Tiruchirappalli", pincode: "", businessFoundAtLocation: "Yes - Active Shop/Office",
    businessOperational: "Yes - Fully Operational", businessOwnedByApplicant: "Yes - Owner",
    businessPremisesType: "Commercial Shop", stockInventoryAvailable: "Moderate / Adequate",
    gstLicenseAvailable: "Yes - Valid License", signboardAvailable: "Yes - Board Displayed",
    customerPresence: "Yes - Met Client", documentsVerified: "Yes - All Documents Valid", remarks: "",
  });

  // Handle Photo Simulation
  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    const mockCoordinates = "12.9716° N, 77.5946° E";
    const timestamp = new Date().toLocaleString();
    toast.success(`Photo Captured at ${mockCoordinates} · ${timestamp}`);
    setPhotos((p) => [...p, `Photo #${p.length + 1} (Geo-tagged)`]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index));
    toast.info("Photo removed");
  };

  // Submit Logic
  const handleResSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const parsed = residentialSchema.safeParse(resForm);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setErrors(errMap);
      toast.error("Please fix validation errors in Residential Form");
      return;
    }

    if (photos.length === 0) {
      toast.error("Please capture at least 1 photo for evidence!");
      return;
    }

    const submittedData = {
      type: "Residential",
      id: `RES-${Date.now().toString().slice(-6)}`,
      name: parsed.data.applicantName,
      timestamp: new Date().toLocaleString(),
      location: "12.9716° N, 77.5946° E",
      details: parsed.data
    };

    setSubmittedForms((prev) => [submittedData, ...prev]);
    toast.success("Residential Verification Form Submitted successfully!");
    
    // Reset state
    setResForm({
      applicantName: "", mobileNumber: "", dateOfBirth: "", aadhaarNumber: "",
      houseNo: "", streetArea: "", cityTown: "", district: "Tiruchirappalli", pincode: "",
      residenceType: "Apartment / Flat", ownershipStatus: "Owned", livingSince: "",
      familyMembers: 1, monthlyRent: 0, contactNeighbor: "", addressFoundMatch: "Yes - Matches Exactly",
      neighborConfirm: "Confirmed", electricityConnection: "Regular Connection",
      waterConnection: "Corporation Water", residenceCondition: "Excellent", remarks: "",
    });
    setPhotos([]);
  };

  const handleBusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = businessSchema.safeParse(busForm);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setErrors(errMap);
      toast.error("Please fix validation errors in Business Form");
      return;
    }

    if (photos.length === 0) {
      toast.error("Please capture at least 1 photo for evidence!");
      return;
    }

    const submittedData = {
      type: "Business",
      id: `BUS-${Date.now().toString().slice(-6)}`,
      name: parsed.data.companyName,
      timestamp: new Date().toLocaleString(),
      location: "12.9716° N, 77.5946° E",
      details: parsed.data
    };

    setSubmittedForms((prev) => [submittedData, ...prev]);
    toast.success("Business Verification Form Submitted successfully!");

    // Reset state
    setBusForm({
      companyName: "", businessType: "Proprietorship", natureOfBusiness: "", yearsInBusiness: 1,
      noOfEmployees: 1, monthlyIncome: 10000, doorNo: "", streetArea: "", landmark: "",
      cityTown: "", district: "Tiruchirappalli", pincode: "", businessFoundAtLocation: "Yes - Active Shop/Office",
      businessOperational: "Yes - Fully Operational", businessOwnedByApplicant: "Yes - Owner",
      businessPremisesType: "Commercial Shop", stockInventoryAvailable: "Moderate / Adequate",
      gstLicenseAvailable: "Yes - Valid License", signboardAvailable: "Yes - Board Displayed",
      customerPresence: "Yes - Met Client", documentsVerified: "Yes - All Documents Valid", remarks: "",
    });
    setPhotos([]);
  };

  const getResInputSetter = (key: keyof ResidentialFormType) => (e: any) => {
    setResForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const getBusInputSetter = (key: keyof BusinessFormType) => (e: any) => {
    setBusForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="space-y-6 pb-12 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Verification Process
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete verification forms and submit for review</p>
        </div>

        <button
          onClick={() => setShowSubmittedModal(true)}
          className="flex items-center gap-2 bg-white border border-[#1E4DB7] text-[#1E4DB7] hover:bg-blue-50 transition-colors px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
        >
          <FiFileText className="w-4.5 h-4.5" />
          <span>View Submitted Forms ({submittedForms.length})</span>
        </button>
      </div>

      {/* ── Form Choice Tabs ── */}
      <div className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl w-fit shadow-sm">
        <button
          onClick={() => { setActiveTab("residential"); setErrors({}); }}
          className={cn(
            "flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all",
            activeTab === "residential" ? "text-white shadow-sm bg-[#1E4DB7]" : "text-gray-500 hover:text-gray-800"
          )}
        >
          <FiHome className="w-4.5 h-4.5" />
          <span>Residential Verification Form</span>
        </button>
        <button
          onClick={() => { setActiveTab("business"); setErrors({}); }}
          className={cn(
            "flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all",
            activeTab === "business" ? "text-white shadow-sm bg-[#1E4DB7]" : "text-gray-500 hover:text-gray-800"
          )}
        >
          <FiBriefcase className="w-4.5 h-4.5" />
          <span>Business Verification Form</span>
        </button>
      </div>

      {/* ── Dynamic Forms Grid View ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side / Main Form Card */}
        <div className="xl:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          
          {activeTab === "residential" ? (
            /* Residential Form View */
            <form onSubmit={handleResSubmit} className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                  <FiHome className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Residential Verification Form</h2>
                  <p className="text-xs text-gray-400">Verify applicant's residential address and personal details</p>
                </div>
              </div>

              {/* 1. Applicant Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1E4DB7] uppercase tracking-wider">1. Applicant Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Applicant Name *</label>
                    <input type="text" placeholder="Enter full name" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.applicantName} onChange={getResInputSetter("applicantName")} />
                    {errors.applicantName && <p className="text-xs text-rose-500 mt-1">{errors.applicantName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Mobile Number *</label>
                    <input type="text" placeholder="Enter mobile number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.mobileNumber} onChange={getResInputSetter("mobileNumber")} />
                    {errors.mobileNumber && <p className="text-xs text-rose-500 mt-1">{errors.mobileNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Date of Birth *</label>
                    <input type="date" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.dateOfBirth} onChange={getResInputSetter("dateOfBirth")} />
                    {errors.dateOfBirth && <p className="text-xs text-rose-500 mt-1">{errors.dateOfBirth}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Aadhaar / ID Number *</label>
                    <input type="text" placeholder="Enter Aadhaar number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.aadhaarNumber} onChange={getResInputSetter("aadhaarNumber")} />
                    {errors.aadhaarNumber && <p className="text-xs text-rose-500 mt-1">{errors.aadhaarNumber}</p>}
                  </div>
                </div>
              </div>

              {/* 2. Residential Address Details */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h3 className="text-xs font-bold text-[#1E4DB7] uppercase tracking-wider">2. Residential Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">House / Door No. *</label>
                    <input type="text" placeholder="Enter house / door number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.houseNo} onChange={getResInputSetter("houseNo")} />
                    {errors.houseNo && <p className="text-xs text-rose-500 mt-1">{errors.houseNo}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Street / Area *</label>
                    <input type="text" placeholder="Enter street / area name" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.streetArea} onChange={getResInputSetter("streetArea")} />
                    {errors.streetArea && <p className="text-xs text-rose-500 mt-1">{errors.streetArea}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">City / Town *</label>
                    <input type="text" placeholder="Enter city / town" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.cityTown} onChange={getResInputSetter("cityTown")} />
                    {errors.cityTown && <p className="text-xs text-rose-500 mt-1">{errors.cityTown}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">District *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.district} onChange={getResInputSetter("district")}>
                      {DISTRICT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Pincode *</label>
                    <input type="text" placeholder="6-digit pincode" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.pincode} onChange={getResInputSetter("pincode")} />
                    {errors.pincode && <p className="text-xs text-rose-500 mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* 3. Residence Information */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h3 className="text-xs font-bold text-[#1E4DB7] uppercase tracking-wider">3. Residence Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Type of Residence *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.residenceType} onChange={getResInputSetter("residenceType")}>
                      {RESIDENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Ownership Status *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.ownershipStatus} onChange={getResInputSetter("ownershipStatus")}>
                      {OWNERSHIP_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Living Since *</label>
                    <input type="date" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.livingSince} onChange={getResInputSetter("livingSince")} />
                    {errors.livingSince && <p className="text-xs text-rose-500 mt-1">{errors.livingSince}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">No. of Family Members *</label>
                    <input type="number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.familyMembers} onChange={getResInputSetter("familyMembers")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Monthly Rent (if rented)</label>
                    <input type="number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.monthlyRent} onChange={getResInputSetter("monthlyRent")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Contact Person (Neighbor) *</label>
                    <input type="text" placeholder="Name & contact of neighbor" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.contactNeighbor} onChange={getResInputSetter("contactNeighbor")} />
                    {errors.contactNeighbor && <p className="text-xs text-rose-500 mt-1">{errors.contactNeighbor}</p>}
                  </div>
                </div>
              </div>

              {/* 4. Verification Details */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h3 className="text-xs font-bold text-[#1E4DB7] uppercase tracking-wider">4. Verification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Address Found As Per Record *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.addressFoundMatch} onChange={getResInputSetter("addressFoundMatch")}>
                      {ADDRESS_MATCH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Neighbor Confirmation *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.neighborConfirm} onChange={getResInputSetter("neighborConfirm")}>
                      {NEIGHBOR_CONFIRMS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Electricity Connection *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.electricityConnection} onChange={getResInputSetter("electricityConnection")}>
                      {ELECTRIC_CONNECTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Water Connection *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.waterConnection} onChange={getResInputSetter("waterConnection")}>
                      {WATER_CONNECTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Residence Condition *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.residenceCondition} onChange={getResInputSetter("residenceCondition")}>
                      {RESIDENCE_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <label>Remarks</label>
                    <span className="text-gray-400">{(resForm.remarks || "").length}/300</span>
                  </div>
                  <textarea
                    placeholder="Enter observations / remarks (optional)"
                    rows={3}
                    maxLength={300}
                    className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none"
                    value={resForm.remarks}
                    onChange={getResInputSetter("remarks")}
                  />
                </div>
              </div>

              {/* Submit footer */}
              <button
                type="submit"
                className="w-full text-white py-3 rounded-2xl text-sm font-bold shadow-sm transition-all hover:opacity-95 flex items-center justify-center gap-2 mt-4"
                style={{ background: "#1E4DB7" }}
              >
                <FiCheckSquare className="w-5 h-5" />
                <span>Submit Residential Verification</span>
              </button>

            </form>
          ) : (
            /* Business Form View */
            <form onSubmit={handleBusSubmit} className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FiBriefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Business Verification Form</h2>
                  <p className="text-xs text-gray-400">Verify applicant's business / shop / company details</p>
                </div>
              </div>

              {/* 1. Business Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">1. Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business / Shop Name *</label>
                    <input type="text" placeholder="Enter business name" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.companyName} onChange={getBusInputSetter("companyName")} />
                    {errors.companyName && <p className="text-xs text-rose-500 mt-1">{errors.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Type *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessType} onChange={getBusInputSetter("businessType")}>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nature of Business *</label>
                    <input type="text" placeholder="e.g. Retail, Manufacturing" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.natureOfBusiness} onChange={getBusInputSetter("natureOfBusiness")} />
                    {errors.natureOfBusiness && <p className="text-xs text-rose-500 mt-1">{errors.natureOfBusiness}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Years in Business *</label>
                    <input type="number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.yearsInBusiness} onChange={getBusInputSetter("yearsInBusiness")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">No. of Employees *</label>
                    <input type="number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.noOfEmployees} onChange={getBusInputSetter("noOfEmployees")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Monthly Income (Approx.) *</label>
                    <input type="number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.monthlyIncome} onChange={getBusInputSetter("monthlyIncome")} />
                  </div>
                </div>
              </div>

              {/* 2. Business Address */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">2. Business Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Door / Shop No. *</label>
                    <input type="text" placeholder="Enter door / shop number" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.doorNo} onChange={getBusInputSetter("doorNo")} />
                    {errors.doorNo && <p className="text-xs text-rose-500 mt-1">{errors.doorNo}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Street / Area *</label>
                    <input type="text" placeholder="Enter street / area" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.streetArea} onChange={getBusInputSetter("streetArea")} />
                    {errors.streetArea && <p className="text-xs text-rose-500 mt-1">{errors.streetArea}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Landmark</label>
                    <input type="text" placeholder="Any nearby landmark" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.landmark} onChange={getBusInputSetter("landmark")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">City / Town *</label>
                    <input type="text" placeholder="Enter city / town" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.cityTown} onChange={getBusInputSetter("cityTown")} />
                    {errors.cityTown && <p className="text-xs text-rose-500 mt-1">{errors.cityTown}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">District *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.district} onChange={getBusInputSetter("district")}>
                      {DISTRICT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Pincode *</label>
                    <input type="text" placeholder="6-digit pincode" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.pincode} onChange={getBusInputSetter("pincode")} />
                    {errors.pincode && <p className="text-xs text-rose-500 mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* 3. Business Verification */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">3. Business Verification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Found At Location *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessFoundAtLocation} onChange={getBusInputSetter("businessFoundAtLocation")}>
                      {BUSINESS_FOUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Operational *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessOperational} onChange={getBusInputSetter("businessOperational")}>
                      {OPERATIONAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Owned By Applicant *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessOwnedByApplicant} onChange={getBusInputSetter("businessOwnedByApplicant")}>
                      {OWNED_BY_APPLICANT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Premises Type *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessPremisesType} onChange={getBusInputSetter("businessPremisesType")}>
                      {PREMISES_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Stock / Inventory Available *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.stockInventoryAvailable} onChange={getBusInputSetter("stockInventoryAvailable")}>
                      {STOCK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">GST / License Available *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.gstLicenseAvailable} onChange={getBusInputSetter("gstLicenseAvailable")}>
                      {GST_LICENSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Verification Details */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">4. Verification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Sign / Board Available *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.signboardAvailable} onChange={getBusInputSetter("signboardAvailable")}>
                      {SIGNBOARD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Customer / Client Presence *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.customerPresence} onChange={getBusInputSetter("customerPresence")}>
                      {CLIENT_PRESENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Documents Verified *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.documentsVerified} onChange={getBusInputSetter("documentsVerified")}>
                      {DOCUMENTS_VERIFIED_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <label>Remarks</label>
                    <span className="text-gray-400">{(busForm.remarks || "").length}/300</span>
                  </div>
                  <textarea
                    placeholder="Enter observations / remarks (optional)"
                    rows={3}
                    maxLength={300}
                    className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none"
                    value={busForm.remarks}
                    onChange={getBusInputSetter("remarks")}
                  />
                </div>
              </div>

              {/* Submit footer */}
              <button
                type="submit"
                className="w-full text-white py-3 rounded-2xl text-sm font-bold shadow-sm transition-all hover:opacity-95 flex items-center justify-center gap-2 mt-4"
                style={{ background: "#10B981" }}
              >
                <FiCheckSquare className="w-5 h-5" />
                <span>Submit Business Verification</span>
              </button>

            </form>
          )}

        </div>

        {/* Right Side / Sidebar Evidence Collection */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Card: Capture & Evidence */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
              <FiCamera className="w-4.5 h-4.5 text-[#1E4DB7]" />
              <span>Evidence Upload</span>
            </h3>

            {/* Simulated Add Photos button */}
            <button
              onClick={handleAddPhoto}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#1E4DB7] hover:bg-blue-50/50 py-6 rounded-2xl transition-all active:scale-98"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                <FiPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Add Photos</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Maximum 5 photos (Geo-tagged)</p>
              </div>
            </button>

            {/* List of captured photos */}
            {photos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Captured ({photos.length})</p>
                {photos.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700">{p}</span>
                    </div>
                    <button onClick={() => handleRemovePhoto(idx)} className="text-gray-400 hover:text-rose-500 p-1">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                <FiInfo className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-semibold leading-snug">Evidence requirement: Must capture at least 1 geo-tagged photo before submitting.</p>
              </div>
            )}
          </div>

          {/* Card: Current Location Info */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
              <FiMapPin className="w-4.5 h-4.5 text-[#1E4DB7]" />
              <span>Location Context</span>
            </h3>

            <div className="space-y-3 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-2.5 py-2.5 px-3 bg-gray-50 border border-gray-100 rounded-xl">
                <FiMapPin className="w-4 h-4 text-[#1E4DB7] shrink-0" />
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Current Coordinates</p>
                  <p className="text-gray-900 mt-0.5">12.9716° N, 77.5946° E</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 py-2.5 px-3 bg-gray-50 border border-gray-100 rounded-xl">
                <FiClock className="w-4 h-4 text-[#1E4DB7] shrink-0" />
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Current Timestamp</p>
                  <p className="text-gray-900 mt-0.5">27 May 2026, 10:30 AM</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Submitted Forms Modal */}
      {showSubmittedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">Submitted Forms Logs</h3>
              </div>
              <button onClick={() => setShowSubmittedModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {submittedForms.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <FiInfo className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold text-gray-500">No submitted forms logged in this session yet.</p>
                </div>
              ) : (
                submittedForms.map((form) => (
                  <div key={form.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase",
                          form.type === "Residential" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          {form.type}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">{form.id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{form.name}</h4>
                      <p className="text-xs text-gray-400">Location: {form.location}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">{form.timestamp}</span>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowSubmittedModal(false)}
                className="text-white bg-[#1E4DB7] hover:opacity-90 px-4 py-2 rounded-xl text-sm font-bold"
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
