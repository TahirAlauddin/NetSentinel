"use client";

import { useState, useEffect, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Asset } from "@/types/assets";

interface AssetCategoryFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function AssetCategoryFilterDialog({
  open,
  onOpenChange,
  assets,
  selectedCategories,
  onCategoriesChange,
}: AssetCategoryFilterDialogProps) {
  // Get unique categories from assets
  const availableCategories = Array.from(
    new Map(
      assets
        .map((asset) => asset.category)
        .filter((cat) => cat)
        .map((cat) => [cat.id, cat])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Initialize state from props
  const [localSelected, setLocalSelected] = useState<string[]>(selectedCategories);
  
  // Sync state when dialog opens - using startTransition to mark as non-urgent
  // This is acceptable because we're responding to an external change (dialog opening)
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setLocalSelected(selectedCategories);
      });
    }
  }, [open, selectedCategories]);

  const handleToggleCategory = (categoryId: string) => {
    setLocalSelected((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    setLocalSelected(availableCategories.map((cat) => cat.id.toString()));
  };

  const handleDeselectAll = () => {
    setLocalSelected([]);
  };

  const handleApply = () => {
    onCategoriesChange(localSelected);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSelected(availableCategories.map((cat) => cat.id.toString()));
    onCategoriesChange(availableCategories.map((cat) => cat.id.toString()));
  };

  const allSelected = localSelected.length === availableCategories.length;
  const noneSelected = localSelected.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter by Category</DialogTitle>
          <DialogDescription>
            Select which asset categories to display in the chart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All / Deselect All */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {localSelected.length} of {availableCategories.length} categories selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allSelected}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={noneSelected}
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Category List */}
          <div className="h-[300px] border rounded-md p-4 overflow-y-auto">
            <div className="space-y-3">
              {availableCategories.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No categories available
                </div>
              ) : (
                availableCategories.map((category) => {
                  const isSelected = localSelected.includes(category.id.toString());
                  return (
                    <div
                      key={category.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleCategory(category.id.toString())}
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleCategory(category.id.toString())}
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {category.name}
                      </Label>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset to All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply}>Apply Filters</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
