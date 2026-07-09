import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  viewAllHref,
  children,
  className,
}: SectionCardProps) {
  return (
    <div className={cn("card-flat flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2
          className="text-[15px] font-semibold text-slate-900"
          style={{ fontFamily: "var(--font-plus-jakarta)" }}
        >
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs font-medium text-[--color-brand-900] hover:underline"
          >
            View All
            <FiChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
