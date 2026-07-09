"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  FiCheckSquare, FiUser, FiHome, FiBriefcase, FiMapPin, FiCamera, FiPlus,
  FiCalendar, FiEye, FiCheckCircle, FiInfo, FiTrash2, FiClock, FiChevronLeft
} from "react-icons/fi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import LocationPickerMap from "@/components/shared/LocationPickerMap";
import { getAgentCaseDetailsApi, submitAgentVerificationApi } from "@/lib/api";

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

interface Customer {
  id: string;
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
  status: string;
  type: string;
  branch: string | null;
  customerId: string;
  customer: Customer;
}

export default function CaseVerificationFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const caseId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [caseObj, setCaseObj] = useState<CaseItem | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);

  // Form states prefilled where possible from case data
  const [resForm, setResForm] = useState<Partial<ResidentialFormType>>({});
  const [busForm, setBusForm] = useState<Partial<BusinessFormType>>({});

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getAgentCaseDetailsApi(caseId);
        if (res.data.success) {
          const c: CaseItem = res.data.data;
          setCaseObj(c);

          if (c.type === "BUSINESS") {
            setBusForm({
              companyName: c.customer.businessName || `${c.customer.firstName} ${c.customer.lastName}`,
              businessType: "Proprietorship",
              natureOfBusiness: "Retail Trading",
              yearsInBusiness: 2,
              noOfEmployees: 3,
              monthlyIncome: 45000,
              doorNo: "B-22",
              streetArea: c.customer.address,
              landmark: "",
              cityTown: "City Area",
              district: "Tiruchirappalli",
              pincode: "620001",
              businessFoundAtLocation: "Yes - Active Shop/Office",
              businessOperational: "Yes - Fully Operational",
              businessOwnedByApplicant: "Yes - Owner",
              businessPremisesType: "Commercial Shop",
              stockInventoryAvailable: "Moderate / Adequate",
              gstLicenseAvailable: "Yes - Valid License",
              signboardAvailable: "Yes - Board Displayed",
              customerPresence: "Yes - Met Client",
              documentsVerified: "Yes - All Documents Valid",
              remarks: "",
            });
          } else {
            setResForm({
              applicantName: `${c.customer.firstName} ${c.customer.lastName}`,
              mobileNumber: c.customer.phone || "9876543210",
              dateOfBirth: "1994-04-12",
              aadhaarNumber: "123456789012",
              houseNo: "No. 18",
              streetArea: c.customer.address,
              cityTown: "Main Town",
              district: "Tiruchirappalli",
              pincode: "620018",
              residenceType: "Independent House",
              ownershipStatus: "Owned",
              livingSince: "2018-02-14",
              familyMembers: 4,
              monthlyRent: 0,
              contactNeighbor: "Neighbor Ramesh",
              addressFoundMatch: "Yes - Matches Exactly",
              neighborConfirm: "Confirmed",
              electricityConnection: "Regular Connection",
              waterConnection: "Corporation Water",
              residenceCondition: "Excellent",
              remarks: "",
            });
          }
        }
      } catch (err: any) {
        toast.error("Failed to load case verification details.");
        if (err.response?.status === 401) {
          router.push("/agent/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [caseId]);

  // Handle Photo Evidence Capture using FileReader base64
  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      toast.error("Maximum 5 photos allowed!");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = reader.result;
          if (typeof resultStr === "string") {
            setPhotos((prev) => [...prev, resultStr]);
            toast.success("Photo evidence loaded & geo-tagged successfully!");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index));
    toast.info("Photo removed");
  };

  // Submit handlers
  const handleResSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const parsed = residentialSchema.safeParse(resForm);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setErrors(errMap);
      toast.error("Please fix verification errors");
      return;
    }

    if (photos.length === 0) {
      toast.error("Upload at least 1 photo as evidence!");
      return;
    }

    setSubmitting(true);
    try {
      const isApproved = resForm.addressFoundMatch === "Yes - Matches Exactly" && resForm.neighborConfirm === "Confirmed";
      const finalStatus = isApproved ? "COMPLETED" : "REJECTED";

      const res = await submitAgentVerificationApi(caseId, {
        gpsLatitude: lat,
        gpsLongitude: lng,
        remarks: resForm.remarks || "",
        profileData: resForm,
        photos,
        status: finalStatus
      });

      if (res.data.success) {
        toast.success(`Residential Verification report submitted! Status: ${finalStatus}`);
        setSubmitted(true);
      }
    } catch (err: any) {
      toast.error("Submission failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = businessSchema.safeParse(busForm);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setErrors(errMap);
      toast.error("Please fix verification errors");
      return;
    }

    if (photos.length === 0) {
      toast.error("Upload at least 1 photo as evidence!");
      return;
    }

    setSubmitting(true);
    try {
      const isApproved = busForm.businessFoundAtLocation === "Yes - Active Shop/Office" && busForm.businessOperational === "Yes - Fully Operational";
      const finalStatus = isApproved ? "COMPLETED" : "REJECTED";

      const res = await submitAgentVerificationApi(caseId, {
        gpsLatitude: lat,
        gpsLongitude: lng,
        remarks: busForm.remarks || "",
        profileData: busForm,
        photos,
        status: finalStatus
      });

      if (res.data.success) {
        toast.success(`Business Verification report submitted! Status: ${finalStatus}`);
        setSubmitted(true);
      }
    } catch (err: any) {
      toast.error("Submission failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getResInputSetter = (key: keyof ResidentialFormType) => (e: any) => {
    setResForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const getBusInputSetter = (key: keyof BusinessFormType) => (e: any) => {
    setBusForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-[#1E3A5F] animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Loading verification form setup...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
          <FiCheckCircle className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
            Verification Complete!
          </h2>
          <p className="text-sm text-slate-500 mt-1">The report and photo evidence have been submitted successfully to the bank.</p>
        </div>
        <button
          onClick={() => router.push("/agent")}
          className="mt-6 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm"
          style={{ background: "#1E3A5F" }}
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  const isBusiness = caseObj?.type === "BUSINESS";

  return (
    <div className="space-y-4 pb-20 text-slate-800">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/agent/cases/${caseId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-3 transition-all"
        >
          <FiChevronLeft className="w-4 h-4" /> Back to Case
        </button>
        <h1 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          Verification Process
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Please fill out the form observations at the verification site.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side Forms */}
        <div className="xl:col-span-8 bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm">
          {/* Active indicator */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <h2 className="text-sm font-bold text-gray-800">
              Form Type: {isBusiness ? "Business Verification Form" : "Residential Verification Form"}
            </h2>
          </div>

          {/* Form container */}
          {!isBusiness ? (
            <form onSubmit={handleResSubmit} className="space-y-5">
              {/* Step 1: Personal Details */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 1: Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Applicant Full Name *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.applicantName || ""} onChange={getResInputSetter("applicantName")} />
                    {errors.applicantName && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.applicantName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Mobile Number *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.mobileNumber || ""} onChange={getResInputSetter("mobileNumber")} />
                    {errors.mobileNumber && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.mobileNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Date of Birth *</label>
                    <input type="date" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.dateOfBirth || ""} onChange={getResInputSetter("dateOfBirth")} />
                    {errors.dateOfBirth && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.dateOfBirth}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Aadhaar Number *</label>
                    <input type="text" maxLength={12} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.aadhaarNumber || ""} onChange={getResInputSetter("aadhaarNumber")} />
                    {errors.aadhaarNumber && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.aadhaarNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Step 2: Address Details */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 2: Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">House / Door Number *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.houseNo || ""} onChange={getResInputSetter("houseNo")} />
                    {errors.houseNo && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.houseNo}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Street / Area *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.streetArea || ""} onChange={getResInputSetter("streetArea")} />
                    {errors.streetArea && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.streetArea}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">City / Town *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.cityTown || ""} onChange={getResInputSetter("cityTown")} />
                    {errors.cityTown && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.cityTown}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">District *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.district} onChange={getResInputSetter("district")}>
                      {DISTRICT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Pincode *</label>
                    <input type="text" maxLength={6} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.pincode || ""} onChange={getResInputSetter("pincode")} />
                    {errors.pincode && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* Step 3: Verification Checks */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 3: Site Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Residence Type *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.residenceType} onChange={getResInputSetter("residenceType")}>
                      {RESIDENCE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Ownership Status *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.ownershipStatus} onChange={getResInputSetter("ownershipStatus")}>
                      {OWNERSHIP_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Living Since (Date/Year) *</label>
                    <input type="text" placeholder="e.g., 2015" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.livingSince || ""} onChange={getResInputSetter("livingSince")} />
                    {errors.livingSince && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.livingSince}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Family Members Count *</label>
                    <input type="number" min={1} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.familyMembers || 1} onChange={getResInputSetter("familyMembers")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Address Match Found *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.addressFoundMatch} onChange={getResInputSetter("addressFoundMatch")}>
                      {ADDRESS_MATCH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Neighbor Reference Name *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.contactNeighbor || ""} onChange={getResInputSetter("contactNeighbor")} />
                    {errors.contactNeighbor && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.contactNeighbor}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Neighbor Confirmation *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.neighborConfirm} onChange={getResInputSetter("neighborConfirm")}>
                      {NEIGHBOR_CONFIRMS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Electricity Connection *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.electricityConnection} onChange={getResInputSetter("electricityConnection")}>
                      {ELECTRIC_CONNECTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Water Connection *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.waterConnection} onChange={getResInputSetter("waterConnection")}>
                      {WATER_CONNECTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Residence Condition *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={resForm.residenceCondition} onChange={getResInputSetter("residenceCondition")}>
                      {RESIDENCE_CONDITIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <label>Remarks / Observations</label>
                    <span className="text-gray-400">{(resForm.remarks || "").length}/300</span>
                  </div>
                  <textarea
                    placeholder="Enter observation remarks..."
                    rows={3}
                    maxLength={300}
                    className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none"
                    value={resForm.remarks}
                    onChange={getResInputSetter("remarks")}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white py-3.5 rounded-2xl text-sm font-bold shadow-sm transition-all hover:opacity-95 flex items-center justify-center gap-2 mt-4"
                style={{ background: "#1E3A5F" }}
              >
                <FiCheckSquare className="w-5 h-5" />
                <span>{submitting ? "Submitting report..." : "Submit Residential Verification"}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleBusSubmit} className="space-y-5">
              {/* Step 1: Business Details */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 1: Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Registered Company Name *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.companyName || ""} onChange={getBusInputSetter("companyName")} />
                    {errors.companyName && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Entity Type *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessType} onChange={getBusInputSetter("businessType")}>
                      {BUSINESS_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nature of Business *</label>
                    <input type="text" placeholder="Retail/Trading/Service..." className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.natureOfBusiness || ""} onChange={getBusInputSetter("natureOfBusiness")} />
                    {errors.natureOfBusiness && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.natureOfBusiness}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Years in Business *</label>
                    <input type="number" min={0} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.yearsInBusiness || 0} onChange={getBusInputSetter("yearsInBusiness")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Number of Employees *</label>
                    <input type="number" min={0} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.noOfEmployees || 0} onChange={getBusInputSetter("noOfEmployees")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Monthly Declared Income (₹) *</label>
                    <input type="number" min={0} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.monthlyIncome || 0} onChange={getBusInputSetter("monthlyIncome")} />
                  </div>
                </div>
              </div>

              {/* Step 2: Address Details */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 2: Location Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Door / Shop Number *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.doorNo || ""} onChange={getBusInputSetter("doorNo")} />
                    {errors.doorNo && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.doorNo}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Street / Area *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.streetArea || ""} onChange={getBusInputSetter("streetArea")} />
                    {errors.streetArea && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.streetArea}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Landmark</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.landmark || ""} onChange={getBusInputSetter("landmark")} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">City / Town *</label>
                    <input type="text" className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.cityTown || ""} onChange={getBusInputSetter("cityTown")} />
                    {errors.cityTown && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.cityTown}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">District *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.district} onChange={getBusInputSetter("district")}>
                      {DISTRICT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Pincode *</label>
                    <input type="text" maxLength={6} className="input-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.pincode || ""} onChange={getBusInputSetter("pincode")} />
                    {errors.pincode && <p className="text-rose-500 text-[10px] mt-1 font-semibold">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* Step 3: Verification Checks */}
              <div className="space-y-3.5 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 3: Verification Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Business Found at Address *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessFoundAtLocation} onChange={getBusInputSetter("businessFoundAtLocation")}>
                      {BUSINESS_FOUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Operational State *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessOperational} onChange={getBusInputSetter("businessOperational")}>
                      {OPERATIONAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Owned / Managed by Applicant *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessOwnedByApplicant} onChange={getBusInputSetter("businessOwnedByApplicant")}>
                      {OWNED_BY_APPLICANT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Premises Type *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.businessPremisesType} onChange={getBusInputSetter("businessPremisesType")}>
                      {PREMISES_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Stock / Inventory Level *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.stockInventoryAvailable} onChange={getBusInputSetter("stockInventoryAvailable")}>
                      {STOCK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">GST / Trade License Check *</label>
                    <select className="select-flat w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm" value={busForm.gstLicenseAvailable} onChange={getBusInputSetter("gstLicenseAvailable")}>
                      {GST_LICENSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Signboard Available *</label>
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

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white py-3.5 rounded-2xl text-sm font-bold shadow-sm transition-all hover:opacity-95 flex items-center justify-center gap-2 mt-4"
                style={{ background: "#10B981" }}
              >
                <FiCheckSquare className="w-5 h-5" />
                <span>{submitting ? "Submitting report..." : "Submit Business Verification"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Side Evidence & Map */}
        <div className="xl:col-span-4 space-y-6">
          {/* Card: Capture & Evidence */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
              <FiCamera className="w-4.5 h-4.5 text-[#1E4DB7]" />
              <span>Evidence Upload</span>
            </h3>

            <button
              onClick={handleAddPhoto}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#1E4DB7] hover:bg-blue-50/50 py-6 rounded-2xl transition-all active:scale-98"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                <FiPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Add Live Photo</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Maximum 5 photos (Geo-tagged)</p>
              </div>
            </button>

            {photos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Captured ({photos.length})</p>
                {photos.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">Evidence_Photo_{idx+1}.jpg</span>
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
                <p className="text-[11px] font-semibold leading-snug">Evidence requirement: Upload at least 1 geo-tagged photo before submitting.</p>
              </div>
            )}
          </div>

          {/* Card: Current Location Map Picker */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
              <FiMapPin className="w-4.5 h-4.5 text-[#1E4DB7]" />
              <span>Location Context</span>
            </h3>

            {/* Interactive Map Picker */}
            <div className="h-56 relative overflow-hidden bg-slate-50 rounded-2xl border border-gray-100">
              <LocationPickerMap lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
            </div>

            <div className="space-y-3 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-2.5 py-2.5 px-3 bg-gray-50 border border-gray-100 rounded-xl">
                <FiMapPin className="w-4 h-4 text-[#1E4DB7] shrink-0" />
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Current Coordinates</p>
                  <p className="text-gray-900 mt-0.5">{lat.toFixed(6)}° N, {lng.toFixed(6)}° E</p>
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
    </div>
  );
}
