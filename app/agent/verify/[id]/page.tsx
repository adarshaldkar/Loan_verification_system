"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiInfo,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import LocationPickerMap from "@/components/shared/LocationPickerMap";
import {
  getAgentCaseByIdApi,
  submitVerificationApi,
  uploadEvidenceApi,
} from "@/lib/api";

const residentialSchema = z.object({
  applicantName: z.string().min(2),
  mobileNumber: z.string().min(10),
  houseNo: z.string().min(1),
  streetArea: z.string().min(2),
  cityTown: z.string().min(2),
  district: z.string().min(1),
  pincode: z.string().regex(/^[0-9]{6}$/),
  remarks: z.string().max(300).optional(),
});

const businessSchema = z.object({
  companyName: z.string().min(2),
  natureOfBusiness: z.string().min(2),
  doorNo: z.string().min(1),
  streetArea: z.string().min(2),
  cityTown: z.string().min(2),
  district: z.string().min(1),
  pincode: z.string().regex(/^[0-9]{6}$/),
  remarks: z.string().max(300).optional(),
});

type ResidentialFormType = z.infer<typeof residentialSchema>;
type BusinessFormType = z.infer<typeof businessSchema>;
type CaseType = "RESIDENTIAL" | "BUSINESS";

type CurrentCase = {
  id: string;
  name: string;
  phone: string;
  type: CaseType;
  address: string;
  branch: string;
  status: string;
};

type EvidencePhoto = {
  id?: string;
  url: string;
  name: string;
};

const DISTRICT_OPTIONS = [
  "Tiruchirappalli",
  "Chennai",
  "Coimbatore",
  "Pondicherry",
  "Madurai",
  "Salem",
];

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentCase, setCurrentCase] = useState<CurrentCase | null>(null);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);

  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsTime, setGpsTime] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const [metCustomer, setMetCustomer] = useState("Yes");
  const [applicantAvailable, setApplicantAvailable] = useState("Yes");
  const [houseExists, setHouseExists] = useState("Yes");

  const [resForm, setResForm] = useState<ResidentialFormType>({
    applicantName: "",
    mobileNumber: "",
    houseNo: "",
    streetArea: "",
    cityTown: "",
    district: "Tiruchirappalli",
    pincode: "",
    remarks: "",
  });

  const [busForm, setBusForm] = useState<BusinessFormType>({
    companyName: "",
    natureOfBusiness: "",
    doorNo: "",
    streetArea: "",
    cityTown: "",
    district: "Tiruchirappalli",
    pincode: "",
    remarks: "",
  });

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await getAgentCaseByIdApi(caseId);
        const fetched = res.data?.data;
        const customer = fetched?.customer ?? {};
        const profile =
          typeof fetched?.profileData === "string"
            ? JSON.parse(fetched.profileData)
            : fetched?.profileData;

        const mappedCase: CurrentCase = {
          id: fetched.id,
          name: customer.name ?? "Unknown",
          phone: customer.phone ?? "",
          type: fetched.type === "BUSINESS" ? "BUSINESS" : "RESIDENTIAL",
          address: customer.address ?? "",
          branch: fetched.branch ?? "Unassigned",
          status: fetched.status ?? "PENDING",
        };
        setCurrentCase(mappedCase);

        if (typeof fetched?.gpsLatitude === "number") setLat(fetched.gpsLatitude);
        if (typeof fetched?.gpsLongitude === "number") setLng(fetched.gpsLongitude);
        if (fetched?.gpsLatitude && fetched?.gpsLongitude) {
          setGpsLocked(true);
        }

        if (Array.isArray(fetched?.media)) {
          const mappedMedia: EvidencePhoto[] = fetched.media.map((m: any, i: number) => ({
            id: m.id,
            url: m.url,
            name: `Evidence #${i + 1}`,
          }));
          setPhotos(mappedMedia);
        }

        setResForm((prev) => ({
          ...prev,
          applicantName: customer.name ?? "",
          mobileNumber: customer.phone ?? "",
          houseNo: profile?.residential?.houseNo ?? "",
          streetArea: profile?.residential?.streetArea ?? "",
          cityTown: profile?.residential?.cityTown ?? "",
          district: profile?.residential?.district ?? prev.district,
          pincode: profile?.residential?.pincode ?? "",
          remarks: profile?.residential?.remarks ?? "",
        }));

        setBusForm((prev) => ({
          ...prev,
          companyName: customer.businessName || customer.name || "",
          natureOfBusiness: profile?.business?.natureOfBusiness ?? "",
          doorNo: profile?.business?.doorNo ?? "",
          streetArea: profile?.business?.streetArea ?? "",
          cityTown: profile?.business?.cityTown ?? "",
          district: profile?.business?.district ?? prev.district,
          pincode: profile?.business?.pincode ?? "",
          remarks: profile?.business?.remarks ?? "",
        }));
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to load case details from server",
        );
        setCurrentCase(null);
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [caseId]);

  const getResSetter =
    (key: keyof ResidentialFormType) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setResForm((prev) => ({ ...prev, [key]: e.target.value }));

  const getBusSetter =
    (key: keyof BusinessFormType) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setBusForm((prev) => ({ ...prev, [key]: e.target.value }));

  const totalSteps = 6;
  const stepLabels = useMemo(
    () => [
      "Verify Customer",
      "Capture GPS",
      "Capture Photo",
      "Form Details",
      "Remarks",
      "Submit",
    ],
    [],
  );

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (photos.length >= 5) {
      toast.error("Maximum 5 photos allowed");
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading evidence...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "PHOTO");
      formData.append("gpsLat", lat.toString());
      formData.append("gpsLng", lng.toString());
      const res = await uploadEvidenceApi(caseId, formData);
      const media = res.data?.data;
      setPhotos((prev) => [
        ...prev,
        { id: media?.id, url: media?.url, name: `Photo #${prev.length + 1}` },
      ]);
      toast.success("Photo uploaded");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Evidence upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateActiveForm = () => {
    const validation =
      currentCase?.type === "BUSINESS"
        ? businessSchema.safeParse(busForm)
        : residentialSchema.safeParse(resForm);

    if (validation.success) {
      setErrors({});
      return true;
    }

    const nextErrors: Record<string, string> = {};
    validation.error.issues.forEach((issue) => {
      if (issue.path[0]) nextErrors[String(issue.path[0])] = issue.message;
    });
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase) return;

    if (!validateActiveForm()) {
      setCurrentStep(4);
      toast.error("Please fix form errors");
      return;
    }
    if (!gpsLocked) {
      toast.error("Please lock GPS before submitting");
      setCurrentStep(2);
      return;
    }
    if (photos.length === 0) {
      toast.error("Please upload at least one evidence photo");
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    try {
      await submitVerificationApi(caseId, {
        remarks:
          (currentCase.type === "BUSINESS" ? busForm.remarks : resForm.remarks) ||
          "Verification completed",
        gpsLatitude: lat,
        gpsLongitude: lng,
        profileData: {
          caseType: currentCase.type,
          metCustomer,
          applicantAvailable,
          houseExists,
          residential: resForm,
          business: busForm,
          photos,
          gpsTime,
        },
      });
      toast.success("Verification submitted successfully");
      router.push(`/agent/cases/${caseId}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-800">
        <FiBriefcase className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm">Case not found</p>
        <button
          onClick={() => router.push("/agent/cases")}
          className="mt-4 text-sm font-semibold text-[#1E4DB7] hover:underline"
        >
          Return to Assigned Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      <button
        onClick={() => router.push(`/agent/cases/${caseId}`)}
        className="flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100"
      >
        <FiChevronLeft className="w-4 h-4" />
        <span>Back to Case Details</span>
      </button>

      <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        {stepLabels.map((label, idx) => {
          const step = idx + 1;
          return (
            <div key={label} className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  currentStep === step
                    ? "text-white bg-[#1E4DB7]"
                    : currentStep > step
                      ? "text-white bg-emerald-500"
                      : "text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800",
                )}
              >
                {step}
              </span>
              <span className={cn("text-xs", currentStep === step ? "text-gray-900 dark:text-slate-100" : "text-gray-400 dark:text-slate-500")}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
          {['APPROVED', 'COMPLETED', 'REJECTED'].includes(currentCase.status) && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-start gap-3">
              <FiInfo className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">Case Closed</p>
                <p className="opacity-90">This case has already been processed ({currentCase.status}). The form below is locked.</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className={cn("space-y-6", ['APPROVED', 'COMPLETED', 'REJECTED'].includes(currentCase.status) && "pointer-events-none opacity-60")}>
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Verify Customer Presence</h2>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Initial verification checks</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select className="border rounded-xl px-3 py-2 text-sm" value={metCustomer} onChange={(e) => setMetCustomer(e.target.value)}>
                    <option value="Yes">Met Customer</option>
                    <option value="No">Did not meet customer</option>
                  </select>
                  <select className="border rounded-xl px-3 py-2 text-sm" value={applicantAvailable} onChange={(e) => setApplicantAvailable(e.target.value)}>
                    <option value="Yes">Applicant available</option>
                    <option value="No">Applicant unavailable</option>
                  </select>
                  <select className="border rounded-xl px-3 py-2 text-sm" value={houseExists} onChange={(e) => setHouseExists(e.target.value)}>
                    <option value="Yes">Premises found</option>
                    <option value="No">Premises not found</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Capture GPS</h2>
                <div className="h-64 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                  <LocationPickerMap
                    lat={lat}
                    lng={lng}
                    onChange={(nextLat, nextLng) => {
                      setLat(nextLat);
                      setLng(nextLng);
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGpsLocked(true);
                    setGpsTime(new Date().toLocaleString());
                    toast.success("GPS locked");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1E4DB7] text-white text-sm"
                >
                  {gpsLocked ? "Re-lock GPS" : "Lock GPS"}
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Capture Evidence Photos</h2>
                <label className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-slate-800 py-6 rounded-2xl cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E4DB7] flex items-center justify-center">
                    <FiPlus className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400">Upload up to 5 photos</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleAddPhoto}
                  />
                </label>
                {photos.length === 0 ? (
                  <div className="flex items-center gap-2 text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <FiInfo className="w-4 h-4" />
                    <span>No evidence uploaded yet.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {photos.map((photo, idx) => (
                      <div key={`${photo.url}-${idx}`} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-xl">
                        <a href={photo.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          {photo.name}
                        </a>
                        <button type="button" onClick={() => handleRemovePhoto(idx)} className="text-gray-400 dark:text-slate-500 hover:text-rose-500">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">
                  {currentCase.type === "BUSINESS" ? "Business Form" : "Residential Form"}
                </h2>
                {currentCase.type === "BUSINESS" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Company Name" value={busForm.companyName} onChange={getBusSetter("companyName")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Nature of Business" value={busForm.natureOfBusiness} onChange={getBusSetter("natureOfBusiness")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Door No" value={busForm.doorNo} onChange={getBusSetter("doorNo")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Street / Area" value={busForm.streetArea} onChange={getBusSetter("streetArea")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="City / Town" value={busForm.cityTown} onChange={getBusSetter("cityTown")} />
                    <select className="border rounded-xl px-3 py-2 text-sm" value={busForm.district} onChange={getBusSetter("district")}>
                      {DISTRICT_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Pincode" value={busForm.pincode} onChange={getBusSetter("pincode")} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Applicant Name" value={resForm.applicantName} onChange={getResSetter("applicantName")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Mobile Number" value={resForm.mobileNumber} onChange={getResSetter("mobileNumber")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="House No" value={resForm.houseNo} onChange={getResSetter("houseNo")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Street / Area" value={resForm.streetArea} onChange={getResSetter("streetArea")} />
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="City / Town" value={resForm.cityTown} onChange={getResSetter("cityTown")} />
                    <select className="border rounded-xl px-3 py-2 text-sm" value={resForm.district} onChange={getResSetter("district")}>
                      {DISTRICT_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="Pincode" value={resForm.pincode} onChange={getResSetter("pincode")} />
                  </div>
                )}
                {Object.keys(errors).length > 0 && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    {Object.entries(errors).map(([k, v]) => (
                      <p key={k}>{k}: {v}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Remarks</h2>
                {currentCase.type === "BUSINESS" ? (
                  <textarea className="w-full border rounded-xl px-3 py-2 text-sm" rows={5} value={busForm.remarks} onChange={getBusSetter("remarks")} placeholder="Add verification remarks" />
                ) : (
                  <textarea className="w-full border rounded-xl px-3 py-2 text-sm" rows={5} value={resForm.remarks} onChange={getResSetter("remarks")} placeholder="Add verification remarks" />
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Submit Verification</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-slate-900 rounded-lg"><span>Case</span><span>{currentCase.id}</span></div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-slate-900 rounded-lg"><span>Type</span><span>{currentCase.type}</span></div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-slate-900 rounded-lg"><span>GPS</span><span>{gpsLocked ? "Locked" : "Not locked"}</span></div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-slate-900 rounded-lg"><span>Photos</span><span>{photos.length}</span></div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              {currentStep > 1 ? (
                <button type="button" className="px-4 py-2 border rounded-xl text-sm" onClick={() => setCurrentStep((s) => s - 1)}>
                  Back
                </button>
              ) : (
                <div />
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 2 && !gpsLocked) return toast.error("Lock GPS first");
                    if (currentStep === 3 && photos.length === 0) return toast.error("Upload at least one photo");
                    if (currentStep === 4 && !validateActiveForm()) return toast.error("Fix form errors");
                    setCurrentStep((s) => s + 1);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#1E4DB7] text-white text-sm"
                >
                  Next
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FiBriefcase className="w-4 h-4 text-[#1E4DB7]" />
              Case Context
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Applicant</span><span className="font-semibold">{currentCase.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Phone</span><span>{currentCase.phone || "-"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Branch</span><span>{currentCase.branch}</span></div>
              <p className="text-gray-500 dark:text-slate-400 pt-2">Address: {currentCase.address || "-"}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-[#1E4DB7]" />
              Location
            </h3>
            <div className="text-xs text-gray-600 dark:text-slate-400">
              <p>{lat.toFixed(6)}, {lng.toFixed(6)}</p>
              <p className="mt-1 flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {gpsTime || "GPS not locked"}
              </p>
            </div>
            <div className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1">
              <FiCamera className="w-3 h-3" />
              {photos.length} evidence file(s)
            </div>
            {gpsLocked && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center gap-2">
                <FiCheckCircle className="w-3 h-3" />
                GPS locked and ready for submit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}