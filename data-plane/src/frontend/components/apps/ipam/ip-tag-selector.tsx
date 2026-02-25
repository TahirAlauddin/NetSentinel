"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag, X } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { IPTag } from "@/types/ipam";
import { toast } from "sonner";

const ipamApi = new IpamApiClient();

interface IPTagSelectorProps {
  selectedTagIds: number[];
  onSelectionChange: (tagIds: number[]) => void;
  ipAddressId?: number;
  disabled?: boolean;
}

export function IPTagSelector({
  selectedTagIds,
  onSelectionChange,
  ipAddressId,
  disabled = false,
}: IPTagSelectorProps) {
  const [tags, setTags] = useState<IPTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const response = await ipamApi.getIPTags({ is_active: true });
      if (response.data) {
        setTags(extractIpamArrayData<IPTag>(response.data));
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    if (disabled) return;

    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    onSelectionChange(newSelection);

    // If IP address ID is provided, apply/remove tag via API
    if (ipAddressId) {
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        if (selectedTagIds.includes(tagId)) {
          // Remove tag - need to find the IPAddressTag ID first
          // For now, just update the selection
          // In a real implementation, you'd need to fetch IPAddressTags and delete the right one
        } else {
          // Apply tag
          ipamApi
            .applyIPTag({
              ip_address: ipAddressId,
              tag: tagId,
            })
            .then(() => {
              toast.success(`Tag "${tag.name}" applied`);
            })
            .catch((error) => {
              console.error("Error applying tag:", error);
              toast.error("Failed to apply tag");
              // Revert selection
              onSelectionChange(selectedTagIds);
            });
        }
      }
    }
  };

  const handleRemoveTag = (tagId: number) => {
    if (disabled) return;
    const newSelection = selectedTagIds.filter((id) => id !== tagId);
    onSelectionChange(newSelection);
  };

  const getColorClass = (color: IPTag["color"]) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      green: "bg-green-100 text-green-800 border-green-300",
      red: "bg-red-100 text-red-800 border-red-300",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      pink: "bg-pink-100 text-pink-800 border-pink-300",
      gray: "bg-gray-100 text-gray-800 border-gray-300",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
      teal: "bg-teal-100 text-teal-800 border-teal-300",
    };
    return colorMap[color] || colorMap.blue;
  };

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            className={`${getColorClass(tag.color)} ${disabled ? "" : "cursor-pointer"}`}
            onClick={() => !disabled && handleRemoveTag(tag.id)}
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag.name}
            {!disabled && <X className="w-3 h-3 ml-1" />}
          </Badge>
        ))}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-1" />
                Add Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <Label>Select Tags</Label>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading tags...</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <Label
                          htmlFor={`tag-${tag.id}`}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          <Badge className={getColorClass(tag.color)}>
                            <Tag className="w-3 h-3 mr-1" />
                            {tag.name}
                          </Badge>
                          {tag.description && (
                            <span className="text-xs text-muted-foreground">
                              {tag.description}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No tags available. Create tags in the tag manager.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
