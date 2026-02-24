"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";

export interface CategoryFilterBadge {
  id: string;
  name: string;
}

export interface AssetsListSearchSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterStatus: string | null;
  onFilterStatusClear: () => void;
  categoryFilters: CategoryFilterBadge[];
  onRemoveCategoryFilter: (categoryId: string) => void;
  onRemoveAllCategoryFilters: () => void;
  totalFilters: number;
  onFiltersClick: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

/**
 * Search section for the assets list: search input, active filter badges,
 * Filters button, view toggle, and per-page selector.
 */
export function AssetsListSearchSection({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search assets by name, user, IP address, notes, manufacturer, asset tag, mac address, serial # or model",
  filterStatus,
  onFilterStatusClear,
  categoryFilters,
  onRemoveCategoryFilter,
  onRemoveAllCategoryFilters,
  totalFilters,
  onFiltersClick,
  viewMode,
  onViewModeChange,
  itemsPerPage,
  onItemsPerPageChange,
}: AssetsListSearchSectionProps) {
  const showCategorySummary =
    categoryFilters.length > 2;
  const categoryNames = categoryFilters.map((c) => c.name);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {filterStatus && (
              <Badge variant="secondary" className="gap-2">
                Status: {filterStatus}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={onFilterStatusClear}
                />
              </Badge>
            )}
            {categoryFilters.length > 0 && (
              <>
                {!showCategorySummary ? (
                  categoryFilters.map(({ id, name }) => (
                    <Badge key={id} variant="secondary" className="gap-2">
                      Type: {name}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => onRemoveCategoryFilter(id)}
                      />
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="gap-2">
                    Type: {categoryNames[0]}, {categoryNames[1]} or{" "}
                    {categoryFilters.length - 2} More
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={onRemoveAllCategoryFilters}
                    />
                  </Badge>
                )}
              </>
            )}
          </div>

          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={onFiltersClick}
          >
            <Filter className="w-4 h-4" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {totalFilters}
              </span>
            )}
          </Button>

          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number.parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
