"use client";

import { useState } from "react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRangeOption {
  label: string;
  value: string;
  periodKey: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export const getDynamicDateRanges = (): DateRangeOption[] => {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const toIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now.getTime() - diffToMonday * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);

  const lastMon = new Date(monday.getTime() - 7 * 86400000);
  const lastSun = new Date(monday.getTime() - 1 * 86400000);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  return [
    {
      label: "Today",
      value: fmt(now),
      periodKey: "Today",
      startDate: toIso(now),
      endDate: toIso(now),
    },
    {
      label: "Last 7 days",
      value: `${fmt(new Date(now.getTime() - 6 * 86400000))} – ${fmt(now)}`,
      periodKey: "Last 7 days",
      startDate: toIso(new Date(now.getTime() - 6 * 86400000)),
      endDate: toIso(now),
    },
    {
      label: "This Week",
      value: `${fmt(monday)} – ${fmt(sunday)}`,
      periodKey: "This Week",
      startDate: toIso(monday),
      endDate: toIso(sunday),
    },
    {
      label: "Last Week",
      value: `${fmt(lastMon)} – ${fmt(lastSun)}`,
      periodKey: "Last Week",
      startDate: toIso(lastMon),
      endDate: toIso(lastSun),
    },
    {
      label: "This Month",
      value: `${fmt(startOfMonth)} – ${fmt(now)}`,
      periodKey: "This Month",
      startDate: toIso(startOfMonth),
      endDate: toIso(now),
    },
    {
      label: "Last Month",
      value: `${fmt(startOfLastMonth)} – ${fmt(endOfLastMonth)}`,
      periodKey: "Last Month",
      startDate: toIso(startOfLastMonth),
      endDate: toIso(endOfLastMonth),
    },
    {
      label: "Custom Range",
      value: "Custom Range",
      periodKey: "Custom Range",
    },
  ];
};

interface DateRangePickerProps {
  value: DateRangeOption;
  onChange: (range: DateRangeOption, startDate?: string, endDate?: string) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

export default function DateRangePicker({
  value,
  onChange,
  className,
  align = "end",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.startDate || "");
  const [customTo, setCustomTo] = useState(value.endDate || "");
  const ranges = getDynamicDateRanges();

  const handleSelectPreset = (r: DateRangeOption) => {
    if (r.label !== "Custom Range") {
      onChange(r, r.startDate, r.endDate);
      setOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return;

    const fmt = (dStr: string) => {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      }
      return dStr;
    };

    const formattedRange = `${fmt(customFrom)} – ${fmt(customTo)}`;
    const customOption: DateRangeOption = {
      label: "Custom Range",
      value: formattedRange,
      periodKey: "Custom Range",
      startDate: customFrom,
      endDate: customTo,
    };

    onChange(customOption, customFrom, customTo);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors cursor-pointer outline-none",
          className
        )}
      >
        <FiCalendar className="w-4 h-4 text-[#1E4DB7] dark:text-blue-400 shrink-0" />
        <span className="font-semibold truncate max-w-[200px] sm:max-w-none">{value.value}</span>
        <FiChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0",
            open && "rotate-180"
          )}
        />
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-64 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl z-50 text-slate-800 dark:text-slate-200"
      >
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1.5">
          Select Date Range
        </p>

        <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
          {ranges.map((r) => {
            const isSelected = value.label === r.label;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => handleSelectPreset(r)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex flex-col cursor-pointer",
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 text-[#1E4DB7] dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                )}
              >
                <span className="text-sm font-medium">{r.label}</span>
                {r.label !== "Custom Range" && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                    {r.value}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Range Section */}
        <div className="px-2 pt-2.5 pb-1 border-t border-slate-100 dark:border-slate-800 mt-2">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Custom Range
          </p>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full text-xs border border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E4DB7]/30"
                placeholder="dd-mm-yyyy"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full text-xs border border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E4DB7]/30"
                placeholder="dd-mm-yyyy"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customFrom || !customTo}
              className="w-full text-xs text-white rounded-xl py-2 font-semibold transition-all shadow-sm bg-[#94A3B8] hover:bg-[#64748B] dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
