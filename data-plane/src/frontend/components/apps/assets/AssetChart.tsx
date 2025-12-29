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
}

/**
 * AssetChart component displays asset category distribution
 * in a pie chart format with a legend
 */
export function AssetChart({ assets, totalAssets }: AssetChartProps) {
  const categoryDistribution = calculateCategoryDistribution(assets)
  const chartData = categoryDistribution.length > 0 ? categoryDistribution : [{ name: "No Assets", value: 1 }]

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
            <div className="text-3xl font-bold">{totalAssets}</div>
            <div className="text-sm text-gray-600">Assets</div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4 max-h-[250px] overflow-y-auto">
            {categoryDistribution.map((item, index) => {
              return (
                <div
                  key={item.name}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 360) / Math.max(categoryDistribution.length, 1)}, 70%, 60%)`,
                      }}
                    ></div>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

