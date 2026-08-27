"use client";

import React from "react";
import { FiCheckCircle, FiXCircle, FiInfo, FiFileText } from "react-icons/fi";
import { cn } from "@/lib/utils";
import {
  VERIFICATION_PROFILES,
  getProfileByCode,
  ProfileSection,
} from "@/lib/verificationProfiles";

export interface StructuredProfileReviewProps {
  profileType: string;
  profileData?: Record<string, any> | null;
}

export default function StructuredProfileReview({
  profileType,
  profileData,
}: StructuredProfileReviewProps) {
  if (!profileData || Object.keys(profileData).length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
        <FiFileText className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          No structured verification responses recorded for this profile.
        </p>
      </div>
    );
  }

  // Handle cases where profileData is nested under "residential" or "business" key
  const actualData: Record<string, any> =
    profileData.residential || profileData.business || profileData;

  const profileConfig = getProfileByCode(profileType || actualData.type || "RESIDENTIAL");

  // Track rendered keys to catch any extra fields
  const renderedKeys = new Set<string>();

  return (
    <div className="space-y-5">
      {/* ── Profile Header Badge ── */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Form Profile
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {profileConfig.name}
          </h4>
        </div>
        <span
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-full border",
            profileConfig.badgeColor
          )}
        >
          {profileConfig.category}
        </span>
      </div>

      {/* ── Render Sections Based on Definition ── */}
      {profileConfig.sections.map((section, sIdx) => {
        const sectionFieldsWithValues = section.fields.filter((f) => {
          renderedKeys.add(f.name);
          return actualData[f.name] !== undefined && actualData[f.name] !== null && String(actualData[f.name]).trim() !== "";
        });

        if (sectionFieldsWithValues.length === 0) return null;

        return (
          <div
            key={sIdx}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              {section.title}
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sectionFieldsWithValues.map((field) => {
                const rawVal = actualData[field.name];
                const isFullWidth =
                  field.type === "textarea" ||
                  field.name.toLowerCase().includes("details") ||
                  field.name.toLowerCase().includes("bank");

                let displayVal = String(rawVal);
                if (typeof rawVal === "boolean") {
                  displayVal = rawVal ? "Yes" : "No";
                }

                const isYes = displayVal.toLowerCase() === "yes" || displayVal.toLowerCase() === "matched" || displayVal.toLowerCase() === "confirmed" || displayVal.toLowerCase() === "traceable" || displayVal.toLowerCase() === "sighted";
                const isNo = displayVal.toLowerCase() === "no" || displayVal.toLowerCase() === "not matched" || displayVal.toLowerCase() === "not confirmed" || displayVal.toLowerCase() === "not traceable" || displayVal.toLowerCase() === "not sighted";

                return (
                  <div
                    key={field.name}
                    className={cn(
                      "p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1",
                      isFullWidth && "sm:col-span-2"
                    )}
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                      {field.label}
                    </span>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      {isYes ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                          {displayVal}
                        </span>
                      ) : isNo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                          <FiXCircle className="w-3 h-3 text-red-600" />
                          {displayVal}
                        </span>
                      ) : (
                        <span className="whitespace-pre-line">{displayVal}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Catch Any Remaining Extra Fields ── */}
      {(() => {
        const skip = ["adminReview", "photos", "type", "residential", "business"];
        const extraEntries = Object.entries(actualData).filter(
          ([k, v]) => !renderedKeys.has(k) && !skip.includes(k) && v !== null && v !== undefined && String(v).trim() !== ""
        );

        if (extraEntries.length === 0) return null;

        return (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              Additional Sighting Data
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extraEntries.map(([k, v]) => {
                if (typeof v === "object") return null;
                const formattedLabel = k
                  .replace(/([A-Z])/g, " $1")
                  .replace(/_/g, " ")
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim();
                return (
                  <div
                    key={k}
                    className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1"
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                      {formattedLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                      {String(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
