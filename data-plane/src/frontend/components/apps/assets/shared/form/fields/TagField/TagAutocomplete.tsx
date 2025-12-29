"use client";

import { Tag } from "@/types/assets";
import { TAG_COLORS } from "@/constants/assets";

interface TagAutocompleteProps {
  tags: Tag[];
  inputValue: string;
  onSelect: (tag: Tag) => void;
  onClose: () => void;
}

/**
 * Autocomplete dropdown component for tag suggestions
 */
export function TagAutocomplete({
  tags,
  inputValue,
  onSelect,
  onClose,
}: TagAutocompleteProps) {
  if (tags.length === 0) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
      <div className="py-1">
        {tags.map((tag, index) => {
          const color = TAG_COLORS[index % TAG_COLORS.length];
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onSelect(tag);
                onClose();
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700">{tag.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

