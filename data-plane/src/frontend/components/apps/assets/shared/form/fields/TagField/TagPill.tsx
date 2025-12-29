"use client";

import { X } from "lucide-react";
import { TAG_COLORS } from "@/constants/assets";

interface TagPillProps {
  tagId: number;
  tagName: string;
  index: number;
  onRemove: (tagId: number) => void;
}

/**
 * Individual tag pill component
 * Displays a tag pill with a color and a remove button
 */
export function TagPill({ tagId, tagName, index, onRemove }: TagPillProps) {
  const color = TAG_COLORS[index % TAG_COLORS.length];
  
  // Guard against invalid props
  if (tagId === undefined || tagId === null || !tagName) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {tagName}
      <button
        type="button"
        onClick={() => onRemove(tagId)}
        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${tagName} tag`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

