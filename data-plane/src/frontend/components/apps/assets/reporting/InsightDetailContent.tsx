"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Asset } from "@/types/assets";
import { calculateWarrantyStatus } from "@/components/apps/assets/utils/calculate";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#a4de6c",
];

export interface InsightDetailContentProps {
  title: string;
  distribution: Array<{ name: string; value: number; assets: Asset[] }>;
  totalLabel: string;
}

function getColor(index: number) {
  return COLORS[index % COLORS.length];
}

function getWarrantyStatusColor(status: string) {
  switch (status) {
    case "In Warranty":
      return "bg-green-500";
    case "Expired":
      return "bg-red-500";
    case "Expiring soon":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}

function getWarrantyStatus(asset: Asset) {
  const status = calculateWarrantyStatus(asset.warranty_expiration);
  return status === "in_warranty"
    ? "In Warranty"
    : status === "expiring_soon"
      ? "Expiring soon"
      : status === "expired"
        ? "Expired"
        : "No Warranty";
}

function getAssetTypeIcon(category: string) {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("laptop") || categoryLower.includes("computer")) return "💻";
  if (categoryLower.includes("phone") || categoryLower.includes("mobile")) return "📱";
  if (categoryLower.includes("desktop")) return "🖥️";
  if (categoryLower.includes("monitor") || categoryLower.includes("display")) return "🖥️";
  if (categoryLower.includes("network")) return "🌐";
  return "📦";
}

function getDisplayValue(
  title: string,
  asset: Asset,
  distribution: Array<{ name: string; value: number; assets: Asset[] }>
): string {
  const warrantyStatus = getWarrantyStatus(asset);
  if (title === "Operating System") return asset.computer_details?.os || "Unknown";
  if (title === "Applications") {
    const appItem = distribution.find((d) => d.assets.some((a) => a.id === asset.id));
    return appItem?.name || "Unknown";
  }
  if (title === "Location") return asset.location?.name || "Unknown";
  if (title === "Warranty") return warrantyStatus;
  if (title === "Model") return asset.model || "Unknown";
  if (title === "Asset Type") return asset.category?.name || "Unknown";
  if (title === "Department") return asset.departments?.[0]?.name || "No Department";
  if (title === "Cost") {
    const cost = asset.purchase_price ? parseFloat(asset.purchase_price) : null;
    if (cost !== null && !isNaN(cost)) return `$${cost.toLocaleString()}`;
    return "Unknown";
  }
  if (title === "Firmware") return asset.network_details?.firmware || "Unknown";
  return "N/A";
}

/**
 * Reusable insight detail content: chart, distribution list, and assets table.
 * Used inside InsightDetailModal or full-page InsightDetailPage.
 */
export function InsightDetailContent({
  title,
  distribution,
  totalLabel,
}: InsightDetailContentProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filteredAssets = selectedItem
    ? distribution.find((item) => item.name === selectedItem)?.assets ?? []
    : distribution.flatMap((item) => item.assets);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  const chartData = distribution.length > 0 ? distribution : [{ name: "No Data", value: 1 }];

  return (
    <div className="space-y-6">
      {/* Chart and Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
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
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(index)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">{totalLabel}</div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Distribution</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {distribution.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`w-full flex justify-between items-center p-3 rounded transition-colors text-left ${
                  selectedItem === item.name
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => setSelectedItem(selectedItem === item.name ? null : item.name)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: getColor(index) }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{item.value}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Assets Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold">Assets ({filteredAssets.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Results per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold">{title}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Asset Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Source</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Tags</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Warranty Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssets.map((asset) => {
                const warrantyStatus = getWarrantyStatus(asset);
                const displayValue = getDisplayValue(title, asset, distribution);
                const colorIndex = distribution.findIndex((d) =>
                  d.assets.some((a) => a.id === asset.id)
                );

                return (
                  <tr
                    key={asset.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/assets/${asset.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: getColor(colorIndex >= 0 ? colorIndex : 0) }}
                        />
                        <span className="text-sm">{displayValue}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-2xl">
                        {getAssetTypeIcon(asset.category?.name ?? "")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{asset.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">System</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {asset.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${getWarrantyStatusColor(warrantyStatus)}`}
                        />
                        <span className="text-sm">{warrantyStatus}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            <div className="flex gap-2 flex-wrap justify-center">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) pageNum = i + 1;
                else if (currentPage <= 4) pageNum = i + 1;
                else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                else pageNum = currentPage - 3 + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
