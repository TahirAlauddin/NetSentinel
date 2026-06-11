import { cn } from "@/lib/utils";
import type { HostAvailability } from "@/types/monitoring";

const AVAILABILITY_CONFIG: Record<HostAvailability, { label: string; className: string; dot: string }> = {
  available: {
    label: "Available",
    className: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  unknown: {
    label: "Unknown",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
    dot: "bg-gray-400",
  },
};

interface AvailabilityBadgeProps {
  availability: HostAvailability;
  className?: string;
}

export function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  const config = AVAILABILITY_CONFIG[availability] ?? AVAILABILITY_CONFIG.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 animate-pulse", config.dot)} />
      {config.label}
    </span>
  );
}
