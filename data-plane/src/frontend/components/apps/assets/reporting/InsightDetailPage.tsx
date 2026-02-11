"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Asset } from "@/types/assets";
import { calculateWarrantyStatus } from "@/components/apps/assets/utils/calculate";
import { AssetsDashboardNav } from "@/components/apps/assets/AssetsDashboardNav";

interface InsightDetailPageProps {
  title: string;
  distribution: Array<{ name: string; value: number; assets: Asset[] }>;
  totalLabel: string;
  onExport?: () => void;
}

/**
 * Reusable component for insight detail pages
 */
export function InsightDetailPage({
  title,
  distribution,
  totalLabel,
  onExport,
}: InsightDetailPageProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Filter assets based on selected item
  const filteredAssets = selectedItem
    ? distribution.find((item) => item.name === selectedItem)?.assets || []
    : distribution.flatMap((item) => item.assets);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Color palette
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

  const getColor = (index: number) => COLORS[index % COLORS.length];

  // Calculate total
  const total = distribution.reduce((sum, item) => sum + item.value, 0);

  // Chart data
  const chartData = distribution.length > 0 ? distribution : [{ name: "No Data", value: 1 }];

  // Get warranty status color
  const getWarrantyStatusColor = (status: string) => {
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
  };

  // Get warranty status
  const getWarrantyStatus = (asset: Asset) => {
    const status = calculateWarrantyStatus(asset.warranty_expiration);
    return status === "in_warranty"
      ? "In Warranty"
      : status === "expiring_soon"
        ? "Expiring soon"
        : status === "expired"
          ? "Expired"
          : "No Warranty";
  };

  // Get asset type icon (simplified)
  const getAssetTypeIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("laptop") || categoryLower.includes("computer")) {
      return "💻";
    } else if (categoryLower.includes("phone") || categoryLower.includes("mobile")) {
      return "📱";
    } else if (categoryLower.includes("desktop")) {
      return "🖥️";
    } else if (categoryLower.includes("monitor") || categoryLower.includes("display")) {
      return "🖥️";
    } else if (categoryLower.includes("network")) {
      return "🌐";
    }
    return "📦";
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Dashboard Navigation */}
        <div className="mb-6">
          <AssetsDashboardNav />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </Button>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onExport}
            >
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => router.back()}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Chart and Distribution */}
        <div className="grid grid-cols-3 gap-6 mb-8">
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
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <div className="text-3xl font-bold">{total}</div>
              <div className="text-sm text-gray-600">{totalLabel}</div>
            </div>
          </Card>

          <Card className="p-6 col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {distribution.map((item, index) => (
                <div
                  key={item.name}
                  className={`flex justify-between items-center p-3 rounded cursor-pointer transition-all ${
                    selectedItem === item.name
                      ? "bg-blue-50 ring-2 ring-blue-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedItem(selectedItem === item.name ? null : item.name)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getColor(index) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Assets Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Assets ({filteredAssets.length})
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Results per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    {title}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Asset Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tags</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Warranty Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssets.map((asset) => {
                  const warrantyStatus = getWarrantyStatus(asset);
                  
                  // Get the appropriate value based on the insight type
                  let displayValue = "N/A";
                  if (title === "Operating System") {
                    displayValue = asset.computer_details?.os || "Unknown";
                  } else if (title === "Applications") {
                    // Find which application this asset belongs to
                    const appItem = distribution.find((d) => d.assets.some((a) => a.id === asset.id));
                    displayValue = appItem?.name || "Unknown";
                  } else if (title === "Availability") {
                    const statusMap: Record<string, string> = {
                      active: "In Use",
                      retired: "Retired",
                      in_repair: "In Repair",
                      disposed: "Disposed",
                    };
                    displayValue = statusMap[asset.status] || asset.status;
                  } else if (title === "Location") {
                    displayValue = asset.location?.name || "Unknown";
                  } else if (title === "Warranty") {
                    displayValue = warrantyStatus;
                  } else if (title === "Model") {
                    displayValue = asset.model || "Unknown";
                  } else if (title === "Asset Type") {
                    displayValue = asset.category?.name || "Unknown";
                  } else if (title === "Department") {
                    displayValue = asset.departments?.[0]?.name || "No Department";
                  } else if (title === "Cost") {
                    const cost = asset.purchase_price ? parseFloat(asset.purchase_price) : null;
                    if (cost !== null && !isNaN(cost)) {
                      displayValue = `$${cost.toLocaleString()}`;
                    } else {
                      displayValue = "Unknown";
                    }
                  } else if (title === "Firmware") {
                    displayValue = asset.network_details?.firmware || "Unknown";
                  }

                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/assets/${asset.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getColor(
                                distribution.findIndex((d) =>
                                  d.assets.some((a) => a.id === asset.id)
                                )
                              ),
                            }}
                          ></div>
                          <span className="text-sm text-gray-900">{displayValue}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-2xl">
                          {getAssetTypeIcon(asset.category?.name || "")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">System</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {asset.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getWarrantyStatusColor(warrantyStatus)}`}
                          ></div>
                          <span className="text-sm text-gray-700">{warrantyStatus}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
              <div className="flex gap-2">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-blue-600" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <span className="px-2 py-1 text-sm text-gray-600">...</span>
                )}
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
    </div>
  );
}
