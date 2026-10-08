import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: number;           // percent change vs last week/period
  trendLabel?: string;      // e.g. "vs last period"
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon,
  iconBg = "bg-brand-50",
  trend,
  trendLabel = "vs prev",
  className,
}: StatsCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral  = trend === undefined || trend === 0;

  return (
    <div
      className={cn(
        "card-flat p-4 sm:p-4.5 flex flex-col justify-between gap-3 hover:shadow-sm transition-all duration-200 min-w-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl",
        className
      )}
    >
      {/* Icon + Label row */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <p
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-tight break-words"
          title={label}
        >
          {label}
        </p>
        <div
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[--color-brand-900] dark:text-slate-200 text-base shrink-0",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <p
        className="text-2xl sm:text-[26px] font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100"
        style={{ fontFamily: "var(--font-plus-jakarta)" }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium pt-0.5 border-t border-slate-100 dark:border-slate-800/60">
          {isPositive && (
            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <FiTrendingUp className="w-3 h-3" />
              <span>+{trend}%</span>
            </div>
          )}
          {isNegative && (
            <div className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
              <FiTrendingDown className="w-3 h-3" />
              <span>{trend}%</span>
            </div>
          )}
          {isNeutral && (
            <div className="flex items-center gap-0.5 text-slate-400 font-medium">
              <FiMinus className="w-3 h-3" />
              <span>0%</span>
            </div>
          )}
          <span className="text-slate-400 text-[10px] truncate">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

