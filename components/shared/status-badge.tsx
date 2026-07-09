import { cn } from "@/lib/utils";

export type VerificationStatus =
  | "Completed"
  | "Pending"
  | "In Progress"
  | "Rejected";

interface StatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusMap: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  Completed:   { label: "Completed",   className: "badge-completed" },
  Pending:     { label: "Pending",     className: "badge-pending" },
  "In Progress": { label: "In Progress", className: "badge-inprogress" },
  Rejected:    { label: "Rejected",    className: "badge-rejected" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status];

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
