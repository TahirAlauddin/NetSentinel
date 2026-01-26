"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import { AssetMetrics } from "@/types/assets"
import { Asset } from "@/types/assets"
import { AssetCategoryFilterDialog } from "./AssetCategoryFilterDialog"

interface AssetMetricsProps {
  /**
   * Asset metrics to display
   */
  metrics: AssetMetrics
  /**
   * Current status filter
   */
  filterStatus: string | null
  /**
   * Callback when status filter changes
   */
  onFilterStatusChange: (status: string | null) => void
  /**
   * All assets for category filtering
   */
  assets: Asset[]
  /**
   * Selected category IDs
   */
  selectedCategories: string[]
  /**
   * Callback when category filter changes
   */
  onCategoriesChange: (categories: string[]) => void
}

/**
 * AssetMetrics component displays warranty metrics in cards
 * and provides status filtering
 */
export function AssetMetricsDisplay({
  metrics,
  filterStatus,
  onFilterStatusChange,
  assets,
  selectedCategories,
  onCategoriesChange,
}: AssetMetricsProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // Get category names for display
  const getCategoryNames = () => {
    const categoryMap = new Map(
      assets
        .map((asset) => asset.category)
        .filter((cat) => cat)
        .map((cat) => [cat.id.toString(), cat.name])
    )
    return selectedCategories.map((id) => categoryMap.get(id) || id)
  }

  const categoryNames = getCategoryNames()
  const hasCategoryFilters = selectedCategories.length > 0
  const allCategories = Array.from(
    new Map(
      assets
        .map((asset) => asset.category)
        .filter((cat) => cat)
        .map((cat) => [cat.id, cat])
    ).values()
  )
  // With reversed logic, we show filters when categories ARE selected (not when all are selected)
  const shouldShowCategoryFilters = hasCategoryFilters

  const handleRemoveCategoryFilter = (categoryId: string) => {
    onCategoriesChange(selectedCategories.filter((id) => id !== categoryId))
  }

  const handleRemoveAllCategoryFilters = () => {
    onCategoriesChange([])
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">At a glance</h2>
      <div className="grid grid-cols-5 gap-4 mb-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total</div>
          <div className="text-4xl font-bold text-blue-600">{metrics.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Active</div>
          <div className="text-4xl font-bold text-green-600">{metrics.active}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Retired</div>
          <div className="text-4xl font-bold text-gray-600">{metrics.retired}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">In Repair</div>
          <div className="text-4xl font-bold text-yellow-600">{metrics.in_repair}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Disposed</div>
          <div className="text-4xl font-bold text-red-600">{metrics.disposed}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center flex-wrap">
          {filterStatus && (
            <Badge variant="secondary" className="gap-2">
              Status: {filterStatus}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFilterStatusChange(null)}
              />
            </Badge>
          )}
          {shouldShowCategoryFilters && (
            <>
              {categoryNames.length <= 2 ? (
                categoryNames.map((name, index) => {
                  const categoryId = selectedCategories[index]
                  return (
                    <Badge key={categoryId} variant="secondary" className="gap-2">
                      Type: {name}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveCategoryFilter(categoryId)}
                      />
                    </Badge>
                  )
                })
              ) : (
                <Badge variant="secondary" className="gap-2">
                  Type: {categoryNames[0]}, {categoryNames[1]} or {categoryNames.length - 2} More
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={handleRemoveAllCategoryFilters}
                  />
                </Badge>
              )}
            </>
          )}
        </div>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => setFilterDialogOpen(true)}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(() => {
            const statusFilterCount = filterStatus ? 1 : 0;
            const categoryFilterCount = hasCategoryFilters ? selectedCategories.length : 0;
            const totalFilters = statusFilterCount + categoryFilterCount;
            return totalFilters > 0 ? (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {totalFilters}
              </span>
            ) : null;
          })()}
        </Button>
      </div>

      {/* Category Filter Dialog */}
      <AssetCategoryFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        assets={assets}
        selectedCategories={selectedCategories}
        onCategoriesChange={onCategoriesChange}
      />
    </div>
  )
}

