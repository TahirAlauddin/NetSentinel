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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Asset } from "@/types/assets";

interface AssetFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  filterStatus: string | null;
  onFilterStatusChange: (status: string | null) => void;
}

export function AssetFilterDialog({
  open,
  onOpenChange,
  assets,
  selectedCategories,
  onCategoriesChange,
  filterStatus,
  onFilterStatusChange,
}: AssetFilterDialogProps) {
  // Get unique categories from assets
  const availableCategories = Array.from(
    new Map(
      assets
        .map((asset) => asset.category)
        .filter((cat) => cat)
        .map((cat) => [cat.id, cat])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(selectedCategories);
  const [localFilterStatus, setLocalFilterStatus] = useState<string>(filterStatus || "all");

  // Sync local state when dialog opens
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setLocalSelectedCategories(selectedCategories);
        setLocalFilterStatus(filterStatus || "all");
      });
    }
  }, [open, selectedCategories, filterStatus]);

  const handleToggleCategory = (categoryId: string) => {
    setLocalSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllCategories = () => {
    setLocalSelectedCategories(availableCategories.map((cat) => cat.id.toString()));
  };

  const handleDeselectAllCategories = () => {
    setLocalSelectedCategories([]);
  };

  const handleApply = () => {
    onCategoriesChange(localSelectedCategories);
    onFilterStatusChange(localFilterStatus === "all" ? null : localFilterStatus);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSelectedCategories(availableCategories.map((cat) => cat.id.toString()));
    setLocalFilterStatus("all");
    onCategoriesChange(availableCategories.map((cat) => cat.id.toString()));
    onFilterStatusChange(null);
  };

  const allCategoriesSelected = localSelectedCategories.length === availableCategories.length;
  const noneSelected = localSelectedCategories.length === 0;
  const hasChanges =
    JSON.stringify(localSelectedCategories.sort()) !== JSON.stringify(selectedCategories.sort()) ||
    (localFilterStatus === "all" ? null : localFilterStatus) !== filterStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Filter assets by status and category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={localFilterStatus}
              onValueChange={(value) => setLocalFilterStatus(value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center">
              <Label>Categories</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllCategories}
                  disabled={allCategoriesSelected}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllCategories}
                  disabled={noneSelected}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {localSelectedCategories.length} of {availableCategories.length} categories selected
            </div>
            <div className="h-[200px] border rounded-md p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {availableCategories.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No categories available
                  </div>
                ) : (
                  availableCategories.map((category) => {
                    const isSelected = localSelectedCategories.includes(category.id.toString());
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
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!hasChanges}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
