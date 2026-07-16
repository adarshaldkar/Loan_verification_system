import { cn } from "@/lib/utils";

export type VerificationStatus =
  | "Completed"
  | "Approved"
  | "Pending"
  | "In Progress"
  | "Rejected"
  | "Re-verification";

interface StatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusMap: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  Completed:   { label: "Completed",   className: "badge-completed" },
  Approved:    { label: "Approved",    className: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50" },
  Pending:     { label: "Pending",     className: "badge-pending" },
  "In Progress": { label: "In Progress", className: "badge-inprogress" },
  Rejected:    { label: "Rejected",    className: "badge-rejected" },
  "Re-verification": { label: "Needs Revision", className: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Normalize status string (e.g., "IN_PROGRESS" -> "In Progress", "PENDING" -> "Pending")
  const normalizedStatus = (
    (status as string) === "IN_PROGRESS" ? "In Progress" :
    (status as string) === "RE_VERIFICATION" ? "Re-verification" :
    (status as string) === "APPROVED" ? "Approved" :
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  ) as VerificationStatus;
  
  const config = statusMap[normalizedStatus] || { label: status, className: "badge-pending" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
        config.className,
        className
      )}
    >
      {/* Dot indicator */}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
