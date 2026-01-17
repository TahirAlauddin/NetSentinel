"use client";

import { List, Grid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * ViewToggle Component
 * Toggle button for switching between list and grid views
 */
export function ViewToggle({
  viewMode,
  onViewModeChange,
  className,
}: ViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 border rounded-md", className)}>
      <button
        onClick={() => onViewModeChange("list")}
        className={cn(
          "p-2 rounded-l-md transition-colors",
          viewMode === "list"
            ? "bg-[oklch(0.40_0.15_249)] text-white"
            : "hover:bg-[oklch(0.93_0_0)]"
        )}
        title="List view"
        aria-label="Switch to list view"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "p-2 rounded-r-md border-l transition-colors",
          viewMode === "grid"
            ? "bg-[oklch(0.40_0.15_249)] text-white"
            : "hover:bg-[oklch(0.93_0_0)]"
        )}
        title="Grid view"
        aria-label="Switch to grid view"
      >
        <Grid className="w-4 h-4" />
      </button>
    </div>
  );
}
