"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import { AssetMetrics } from "@/types/assets"

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
}

/**
 * AssetMetrics component displays warranty metrics in cards
 * and provides status filtering
 */
export function AssetMetricsDisplay({
  metrics,
  filterStatus,
  onFilterStatusChange,
}: AssetMetricsProps) {
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

      {/* Status Filter */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center">
          {filterStatus && (
            <Badge variant="secondary" className="gap-2">
              Status: {filterStatus}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFilterStatusChange(null)}
              />
            </Badge>
          )}
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>
    </div>
  )
}

