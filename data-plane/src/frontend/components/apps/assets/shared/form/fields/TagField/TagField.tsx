"use client";

import { useRef, KeyboardEvent, useState, useEffect, useMemo } from "react";

import { MAX_TAGS_PER_ASSET } from "@/constants/assets";

import { FormField } from "../../FormField";
import { useTagInput } from "./useTagInput";
import { TagAutocomplete } from "./TagAutocomplete";
import { TagPill } from "./TagPill";
import { Tag } from "@/types/assets";

interface TagFieldProps {
  label: string;
  value?: Tag[]; // Array of tag IDs
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
}

/**
 * TagInput component for adding tags to an asset
 * Allows adding tags by pressing Enter and removing them with X button
 * Features autocomplete suggestions from existing tags
 * Uses round-robin color selection from predefined colors
 */
export function TagField({
  label,
  value = [],
  onChange,
  placeholder = "Type a tag and press Enter",
  optional,
  required,
}: TagFieldProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [manuallyClosed, setManuallyClosed] = useState(false);

  const {
    inputValue,
    setInputValue,
    loading,
    filteredTags,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
  } = useTagInput({ value, onChange });

  // Derive base autocomplete visibility from filtered tags and input value
  const shouldShowAutocomplete = useMemo(
    () => filteredTags.length > 0 && inputValue.trim().length > 0,
    [filteredTags, inputValue]
  );

  // Combine derived value with manual override
  const showAutocomplete = shouldShowAutocomplete && !manuallyClosed;

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTags.length > 0) {
        // Select first suggestion if available
        handleSelectTag(filteredTags[0]);
      } else {
        // Create new tag
        handleAddTag(inputValue);
      }
      setManuallyClosed(true);
    } else if (e.key === "Escape") {
      setManuallyClosed(true);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      handleRemoveTag(value[value.length - 1].id);
    } else if (e.key === "ArrowDown" && filteredTags.length > 0) {
      e.preventDefault();
      setManuallyClosed(false);
    }
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setManuallyClosed(true);
        }
      };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <FormField label={label} optional={optional} required={required}>
      <div ref={containerRef} className="relative">
        <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[42px] items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          {/* Display existing tags */}
          {value.map((tag, index) => (
            <TagPill
              key={tag.id}
              tagId={tag.id}
              tagName={tag.name}
              index={index}
              onRemove={handleRemoveTag}
            />
          ))}

          {/* Input field */}
          {value.length < MAX_TAGS_PER_ASSET && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setManuallyClosed(false);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (filteredTags.length > 0 && inputValue.trim().length > 0) {
                  setManuallyClosed(false);
                }
              }}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
              disabled={loading}
            />
          )}

          {/* Max tags message */}
          {value.length >= MAX_TAGS_PER_ASSET && (
            <span className="text-xs text-gray-500">
              Maximum {MAX_TAGS_PER_ASSET} tags reached
            </span>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showAutocomplete && filteredTags.length > 0 && (
          <TagAutocomplete
            tags={filteredTags}
            inputValue={inputValue}
            onSelect={handleSelectTag}
            onClose={() => setManuallyClosed(true)}
          />
        )}
      </div>

      {/* Helper text */}
      {value.length > 0 && value.length < MAX_TAGS_PER_ASSET && (
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to add tag. {MAX_TAGS_PER_ASSET - value.length} tag(s)
          remaining.
        </p>
      )}
    </FormField>
  );
}
