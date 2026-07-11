import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: number;           // percent change vs last week
  trendLabel?: string;      // e.g. "vs last week"
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon,
  iconBg = "bg-brand-50",
  trend,
  trendLabel = "vs last week",
  className,
}: StatsCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral  = trend === undefined || trend === 0;

  return (
    <div
      className={cn(
        "card-flat p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow duration-200",
        className
      )}
    >
      {/* Icon + Label row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-[--color-brand-900] dark:text-slate-200 text-lg",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <p
        className="text-[28px] font-bold leading-none tracking-tight text-slate-900"
        style={{ fontFamily: "var(--font-plus-jakarta)" }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isPositive && (
            <>
              <FiTrendingUp className="trend-up w-3.5 h-3.5" />
              <span className="trend-up">+{trend}%</span>
            </>
          )}
          {isNegative && (
            <>
              <FiTrendingDown className="trend-down w-3.5 h-3.5" />
              <span className="trend-down">{trend}%</span>
            </>
          )}
          {isNeutral && (
            <>
              <FiMinus className="trend-neutral w-3.5 h-3.5" />
              <span className="trend-neutral">No change</span>
            </>
          )}
          <span className="text-slate-400">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
