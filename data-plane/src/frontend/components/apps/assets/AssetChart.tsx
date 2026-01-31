"use client"

import { Card } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { calculateCategoryDistribution } from "./utils"
import { Asset } from "@/types/assets"

interface AssetChartProps {
  /**
   * Assets to calculate distribution from
   */
  assets: Asset[]
  /**
   * Total number of assets
   */
  totalAssets: number
  /**
   * Selected category IDs to filter by (empty array = show all)
   */
  selectedCategories?: string[]
  /**
   * Callback when a category label is clicked
   */
  onCategoryClick?: (categoryId: string, categoryName: string) => void
}

/**
 * AssetChart component displays asset category distribution
 * in a pie chart format with a legend
 */
export function AssetChart({
  assets,
  totalAssets: _,
  selectedCategories = [],
  onCategoryClick,
}: AssetChartProps) {
  // Get all categories (not filtered) to show all labels
  const allCategoryDistribution = calculateCategoryDistribution(assets);
  
  // Create a map of category name to ID for click handling
  const categoryNameToIdMap = new Map<string, string>();
  assets.forEach((asset) => {
    if (asset.category) {
      categoryNameToIdMap.set(asset.category.name, asset.category.id.toString());
    }
  });

  // Filter assets by selected categories
  // If no categories are selected, show all assets (default behavior)
  const filteredAssets =
    selectedCategories.length > 0
      ? assets.filter((asset) =>
          selectedCategories.includes(asset.category?.id.toString() || "")
        )
      : assets // Show all when nothing is selected

  const categoryDistribution = calculateCategoryDistribution(filteredAssets)
  const chartData = categoryDistribution.length > 0 ? categoryDistribution : [{ name: "No Assets", value: 1 }]
  
  // Calculate total for filtered assets
  const filteredTotal = filteredAssets.length

  const handleCategoryClick = (categoryName: string) => {
    if (onCategoryClick) {
      const categoryId = categoryNameToIdMap.get(categoryName);
      if (categoryId) {
        onCategoryClick(categoryId, categoryName);
      }
    }
  }

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h2>
      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${(index * 360) / chartData.length}, 70%, 60%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <div className="text-3xl font-bold">{filteredTotal}</div>
            <div className="text-sm text-gray-600">Assets</div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4 max-h-[250px] overflow-y-auto">
            {allCategoryDistribution.map((item, index) => {
              const categoryId = item.id || categoryNameToIdMap.get(item.name);
              const isSelected = categoryId ? selectedCategories.includes(categoryId) : false;
              
              // Show the total count for all categories (not filtered)
              // Selected categories will be highlighted
              return (
                <div
                  key={item.name}
                  className={`flex justify-between items-center p-3 rounded cursor-pointer transition-all ${
                    isSelected
                      ? " ring-blue-500 bg-blue-50"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => handleCategoryClick(item.name)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 360) / Math.max(allCategoryDistribution.length, 1)}, 70%, 60%)`,
                      }}
                    ></div>
                    <span
                      className={`text-sm transition-colors ${
                        isSelected
                          ? "font-bold text-blue-700"
                          : "text-gray-700 hover:text-blue-600"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${isSelected ? "text-blue-700" : "text-gray-500"}`}>
                    {item.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

