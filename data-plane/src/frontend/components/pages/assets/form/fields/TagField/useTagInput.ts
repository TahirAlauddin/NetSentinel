"use client";

import { useState, useEffect, useCallback } from "react";

import { Tag } from "@/types/assets";
import { MAX_TAGS_PER_ASSET } from "@/constants/assets";
import { listAssetTags, createAssetTag } from "@/app/(app)/assets/actions";

import { toast } from "sonner";

interface UseTagInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
}

/**
 * Hook for managing tag input state and operations
 */
export function useTagInput({ value, onChange }: UseTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  // Fetch all tags from database
  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true);
        const allTags = await listAssetTags();
        setTags(allTags);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setTags([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTags();
  }, []);

  // Filter tags based on input value
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredTags([]);
      return;
    }

    const trimmedInput = inputValue.toLowerCase().trim();
    const filtered = tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(trimmedInput) &&
        !value.some((t) => t.id === tag.id) // Don't show already added tags
    );
    setFilteredTags(filtered.slice(0, 10)); // Limit to 10 suggestions
  }, [inputValue, tags, value]);

  // Get tag name by ID
  const getTagName = useCallback(
    (tagId: number): string => {
      const tag = tags.find((t) => t.id === tagId);
      return tag?.name || `Tag ${tagId}`;
    },
    [tags]
  );

  // Handle adding a new tag
  const handleAddTag = useCallback(
    async (tagName: string) => {
      const trimmedName = tagName.trim();
      if (!trimmedName) return false;

      // Check max tags limit
      if (value.length >= MAX_TAGS_PER_ASSET) {
        toast.error(`Maximum ${MAX_TAGS_PER_ASSET} tags allowed per asset`);
        return false;
      }

      // Check if tag already exists in the list
      const existingTag = tags.find(
        (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
      );

      let tagId: number;

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // Create new tag
        try {
          const result = await createAssetTag({ name: trimmedName });
          if (result.success && result.data) {
            tagId = result.data.id;
            // Add to local tags list
            setTags((prev) => [...prev, result.data!]);
          } else {
            toast.error(result.error || "Failed to create tag");
            return false;
          }
        } catch (error) {
          console.error("Error creating tag:", error);
          toast.error("Failed to create tag");
          return false;
        }
      }

      // Check if tag is already added
      if (value.some((tag) => tag.id === tagId)) {
        toast.info("This tag is already added");
        return false;
      }

      // Add tag ID to the list
      onChange([...value, { id: tagId, name: trimmedName }]);
      setInputValue("");
      setFilteredTags([]);
      return true;
    },
    [tags, value, onChange]
  );

  // Handle removing a tag
  const handleRemoveTag = useCallback(
    (tagId: number) => {
      onChange(value.filter((tag) => tag.id !== tagId));
    },
    [value, onChange]
  );

  // Handle selecting a tag from autocomplete
  const handleSelectTag = useCallback(
    async (tag: Tag) => {
      if (value.some((t) => t.id === tag.id)) {
        toast.info("This tag is already added");
        return;
      }

      if (value.length >= MAX_TAGS_PER_ASSET) {
        toast.error(`Maximum ${MAX_TAGS_PER_ASSET} tags allowed per asset`);
        return;
      }

      onChange([...value, tag]);
      setInputValue("");
      setFilteredTags([]);
    },
    [value, onChange]
  );

  return {
    inputValue,
    setInputValue,
    tags,
    loading,
    filteredTags,
    getTagName,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
  };
}

