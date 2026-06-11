import { cn } from "@/lib/utils";
import type { TriggerSeverity } from "@/types/monitoring";

const SEVERITY_CONFIG: Record<
  TriggerSeverity,
  { label: string; className: string; dot: string }
> = {
  not_classified: {
    label: "Not classified",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
    dot: "bg-gray-400",
  },
  information: {
    label: "Information",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  warning: {
    label: "Warning",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    dot: "bg-yellow-500",
  },
  average: {
    label: "Average",
    className: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
  },
  high: {
    label: "High",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  disaster: {
    label: "Disaster",
    className: "bg-red-100 text-red-900 border border-red-300 font-semibold",
    dot: "bg-red-700",
  },
};

interface SeverityBadgeProps {
  severity: TriggerSeverity;
  className?: string;
  showDot?: boolean;
}

export function SeverityBadge({ severity, className, showDot = true }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.not_classified;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0", config.dot)} />
      )}
      {config.label}
    </span>
  );
}

export function severityOrder(severity: TriggerSeverity): number {
  const order: Record<TriggerSeverity, number> = {
    disaster: 6,
    high: 5,
    average: 4,
    warning: 3,
    information: 2,
    not_classified: 1,
  };
  return order[severity] ?? 0;
}
