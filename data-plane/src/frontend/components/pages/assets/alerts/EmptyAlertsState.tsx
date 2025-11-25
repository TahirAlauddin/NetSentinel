"use client";

import { Plus } from "lucide-react";

interface EmptyAlertsStateProps {
  onAddAlert: () => void;
}

/**
 * Empty state component when no alerts exist
 */
export function EmptyAlertsState({ onAddAlert }: EmptyAlertsStateProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onAddAlert}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
        aria-label="Add alert"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onAddAlert}
        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
      >
        Add Alert
      </button>
    </div>
  );
}

