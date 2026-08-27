"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FiCheckCircle,
  FiMapPin,
  FiCamera,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiSave,
  FiSend,
  FiRotateCcw,
} from "react-icons/fi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationPickerMap from "@/components/shared/LocationPickerMap";
import {
  VerificationProfileConfig,
  ProfileField,
  getProfileByCode,
} from "@/lib/verificationProfiles";
import { uploadEvidenceApi } from "@/lib/api";

export interface DynamicVerificationFormProps {
  profileCode: string;
  initialData?: Record<string, any>;
  caseId?: string;
  applicantDefaultName?: string;
  applicantDefaultPhone?: string;
  applicantDefaultAddress?: string;
  isSubmitting?: boolean;
  onSubmit: (formData: {
    profileType: string;
    profileData: Record<string, any>;
    latitude: number;
    longitude: number;
    photos: { url: string; name: string }[];
  }) => Promise<void>;
}

export default function DynamicVerificationForm({
  profileCode,
  initialData = {},
  caseId,
  applicantDefaultName,
  applicantDefaultPhone,
  applicantDefaultAddress,
  isSubmitting = false,
  onSubmit,
}: DynamicVerificationFormProps) {
  const profile = useMemo(() => getProfileByCode(profileCode), [profileCode]);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // GPS Location State
  const [lat, setLat] = useState<number>(12.9716);
  const [lng, setLng] = useState<number>(77.5946);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>("Detecting...");

  // Draft Key
  const draftKey = `draft_verify_${caseId || profile.code}`;

  // Initialize form data with defaults and initialData
  useEffect(() => {
    const initial: Record<string, any> = {};

    profile.sections.forEach((section) => {
      section.fields.forEach((f) => {
        initial[f.name] = f.defaultValue || "";
      });
    });

    // Populate passed defaults
    if (applicantDefaultName) initial.applicantName = applicantDefaultName;
    if (applicantDefaultAddress) initial.address = applicantDefaultAddress;

    // Load saved draft if present
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        Object.assign(initial, parsed.formData || {});
        if (parsed.photos) setPhotos(parsed.photos);
        toast.info("Restored draft data for this form");
      }
    } catch {
      // Ignore localStorage errors
    }

    // Merge with any explicit initialData
    Object.assign(initial, initialData);

    setFormData(initial);
  }, [profile, caseId, draftKey]);

  // Auto-fetch agent GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setGpsLocked(true);
          setGpsAccuracy(`±${Math.round(pos.coords.accuracy)}m`);
        },
        () => {
          setGpsAccuracy("GPS permission denied - using default");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Save draft to localStorage
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ formData, photos, updatedAt: new Date().toISOString() })
      );
      toast.success("Draft saved successfully to local storage");
    } catch {
      toast.error("Failed to save draft");
    }
  };

  // Clear draft
  const handleResetForm = () => {
    if (confirm("Are you sure you want to reset all fields in this form?")) {
      const empty: Record<string, any> = {};
      profile.sections.forEach((s) =>
        s.fields.forEach((f) => {
          empty[f.name] = f.defaultValue || "";
        })
      );
      if (applicantDefaultName) empty.applicantName = applicantDefaultName;
      setFormData(empty);
      setPhotos([]);
      setErrors({});
      localStorage.removeItem(draftKey);
      toast.info("Form reset");
    }
  };

  // Field change handler
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 8) {
      toast.error("Maximum 8 evidence photos allowed");
      return;
    }

    setUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (caseId) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("type", "EVIDENCE");
          const res = await uploadEvidenceApi(caseId, fd);
          if (res.data?.success && res.data?.data?.url) {
            setPhotos((prev) => [...prev, { url: res.data.data.url, name: file.name }]);
          }
        } else {
          // Local fallback preview for standalone forms
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const url = uploadEvent.target?.result as string;
            setPhotos((prev) => [...prev, { url, name: file.name }]);
          };
          reader.readAsDataURL(file);
        }
      }
      toast.success("Photo(s) added successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    profile.sections.forEach((section) => {
      section.fields.forEach((f) => {
        if (f.required) {
          const val = formData[f.name];
          if (val === undefined || val === null || String(val).trim() === "") {
            newErrors[f.name] = `${f.label} is required`;
          }
        }
      });
    });

    if (photos.length === 0) {
      newErrors["photos"] = "At least one geo-tagged evidence photo is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(`Please fill in all ${Object.keys(newErrors).length} required field(s)`);
      return false;
    }

    return true;
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit({
        profileType: profile.code,
        profileData: formData,
        latitude: lat,
        longitude: lng,
        photos,
      });

      // Clear draft on successful submission
      localStorage.removeItem(draftKey);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Submission failed. Please check entries.");
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* ─── Profile Header Card ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "px-2.5 py-0.5 text-xs font-semibold rounded-full border",
                profile.badgeColor
              )}
            >
              {profile.category}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {profile.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">{profile.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition"
          >
            <FiSave className="w-3.5 h-3.5" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1.5 transition"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left 2 Columns: Dynamic Form Sections ─── */}
        <div className="lg:col-span-2 space-y-6">
          {profile.sections.map((section, sIdx) => (
            <div
              key={sIdx}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {section.title}
                </h3>
                {section.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field) => {
                  const isFullWidth =
                    field.type === "textarea" ||
                    field.name.toLowerCase().includes("details") ||
                    field.name.toLowerCase().includes("bank");
                  const hasError = !!errors[field.name];

                  return (
                    <div
                      key={field.name}
                      className={cn("space-y-1.5", isFullWidth && "md:col-span-2")}
                    >
                      <Label
                        htmlFor={field.name}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                      >
                        <span>
                          {field.label}{" "}
                          {field.required && <span className="text-red-500">*</span>}
                        </span>
                      </Label>

                      {/* Render based on field type */}
                      {field.type === "select" ? (
                        <Select
                          value={formData[field.name] || ""}
                          onValueChange={(v) => v && handleFieldChange(field.name, v)}
                        >
                          <SelectTrigger
                            id={field.name}
                            className={cn(
                              "h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50",
                              hasError && "border-red-500 ring-1 ring-red-500/20"
                            )}
                          >
                            <SelectValue placeholder={`Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "textarea" ? (
                        <Textarea
                          id={field.name}
                          rows={3}
                          value={formData[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          className={cn(
                            "text-xs bg-slate-50/50 dark:bg-slate-800/50 resize-y",
                            hasError && "border-red-500 ring-1 ring-red-500/20"
                          )}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          value={formData[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          className={cn(
                            "h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50",
                            hasError && "border-red-500 ring-1 ring-red-500/20"
                          )}
                        />
                      )}

                      {hasError && (
                        <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                          <FiAlertCircle className="w-3 h-3" />
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Right Column: Evidence Photos & GPS Verification ─── */}
        <div className="space-y-6">
          {/* 1. Evidence Photos Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FiCamera className="w-4 h-4 text-blue-600" />
                Geo-Tagged Evidence
              </h3>
              <span className="text-xs text-slate-500">{photos.length}/8 photos</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {photos.map((photo, pIdx) => (
                <div
                  key={pIdx}
                  className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 aspect-video flex items-center justify-center"
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(pIdx)}
                      className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {photos.length < 8 && (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 hover:bg-blue-50/20 transition group">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                  <FiPlus className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition mb-1" />
                  <span className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600">
                    {uploadingPhoto ? "Uploading..." : "Add Photo"}
                  </span>
                </label>
              )}
            </div>

            {errors.photos && (
              <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" />
                {errors.photos}
              </p>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-start gap-2">
              <FiInfo className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Capture clear photos of the applicant, door/signboard, premises, and meter
                to support the report.
              </span>
            </p>
          </div>

          {/* 2. GPS Location Context */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-emerald-600" />
                Live Location Context
              </h3>
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                  gpsLocked
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {gpsLocked ? "GPS Locked" : "Default GPS"}
              </span>
            </div>

            <div className="h-[180px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <LocationPickerMap
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                  setGpsLocked(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Lat: <strong className="text-slate-700">{lat.toFixed(5)}</strong>
              </span>
              <span>
                Lng: <strong className="text-slate-700">{lng.toFixed(5)}</strong>
              </span>
              <span>{gpsAccuracy}</span>
            </div>
          </div>

          {/* 3. Final Submission Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || uploadingPhoto}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  Submit {profile.name}
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              All responses will be securely transmitted to the admin verification panel.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
