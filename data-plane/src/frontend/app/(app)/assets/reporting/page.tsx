"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Asset } from "@/types/assets";
import { listAssets } from "../actions/index";
import { AssetsDashboardNav } from "@/components/apps/assets/AssetsDashboardNav";
import {
  calculateCategoryDistribution,
  calculateOSDistribution,
  calculateApplicationsDistribution,
  calculateAvailabilityDistribution,
  calculateLocationDistribution,
  calculateWarrantyDistribution,
  calculateModelDistribution,
  calculateDepartmentDistribution,
  calculateCostDistribution,
  calculateFirmwareDistribution,
} from "@/components/apps/assets/utils/calculate";

/**
 * Asset Reporting Page - Main reporting dashboard with insights
 */
export default function AssetReportingPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const [selectedAttribute, setSelectedAttribute] = useState<string>("Operating System");

  // Load assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        const data = await listAssets();
        setAssets(data);
      } catch (err) {
        console.error("Error loading assets:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Calculate distributions
  const categoryDistribution = calculateCategoryDistribution(assets);
  const osDistribution = calculateOSDistribution(assets);
  const applicationsDistribution = calculateApplicationsDistribution(assets);
  const availabilityDistribution = calculateAvailabilityDistribution(assets);
  const locationDistribution = calculateLocationDistribution(assets);
  const warrantyDistribution = calculateWarrantyDistribution(assets);
  const modelDistribution = calculateModelDistribution(assets);
  const departmentDistribution = calculateDepartmentDistribution(assets);
  const costDistribution = calculateCostDistribution(assets);
  const firmwareDistribution = calculateFirmwareDistribution(assets);

  // Get total counts
  const totalAssets = assets.length;
  const totalOS = osDistribution.reduce((sum, item) => sum + item.value, 0);
  const totalApplications = applicationsDistribution.reduce((sum, item) => sum + item.value, 0);

  // Color palette for charts
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

  const getColor = (index: number, total: number) => {
    return COLORS[index % COLORS.length];
  };

  // Render donut chart
  const renderDonutChart = (
    data: Array<{ name: string; value: number }>,
    total: number,
    label: string
  ) => {
    const chartData = data.length > 0 ? data : [{ name: "No Data", value: 1 }];
    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index, chartData.length)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    );
  };

  // Render insight card
  const renderInsightCard = (
    title: string,
    distribution: Array<{ name: string; value: number }>,
    total: number,
    label: string,
    route: string
  ) => {
    return (
      <Card className="p-6 relative">
        <div className="absolute top-4 right-4">
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
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-2 gap-6">
          {renderDonutChart(distribution.slice(0, 10), total, label)}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {distribution.slice(0, 10).map((item, index) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getColor(index, distribution.length) }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => router.push(route)}
        >
          View All Details
        </Button>
      </Card>
    );
  };

  // Get distribution for selected attribute
  const getSelectedDistribution = (): Array<{ name: string; value: number }> => {
    switch (selectedAttribute) {
      case "Operating System":
        return osDistribution;
      case "Applications":
        return applicationsDistribution;
      case "Availability":
        return availabilityDistribution;
      case "Location":
        return locationDistribution;
      case "Warranty":
        return warrantyDistribution;
      case "Model":
        return modelDistribution;
      case "Asset Type":
        return categoryDistribution;
      case "Department":
        return departmentDistribution;
      case "Cost":
        return costDistribution;
      case "Firmware":
        return firmwareDistribution;
      default:
        return [];
    }
  };

  // Get route for selected attribute
  const getAttributeRoute = (attribute: string) => {
    const routeMap: Record<string, string> = {
      "Operating System": "/assets/reporting/operating-system",
      Applications: "/assets/reporting/applications",
      Availability: "/assets/reporting/availability",
      Location: "/assets/reporting/location",
      Warranty: "/assets/reporting/warranty",
      Model: "/assets/reporting/model",
      "Asset Type": "/assets/reporting/asset-type",
      Department: "/assets/reporting/department",
      Cost: "/assets/reporting/cost",
      Firmware: "/assets/reporting/firmware",
    };
    return routeMap[attribute] || "#";
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center py-12">
              <div className="text-gray-500">Loading reporting data...</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">Assets &gt; Insights</div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Asset Reporting</h1>
            </div>

            {/* Dashboard Navigation */}
            <AssetsDashboardNav />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("insights")}
              className={`pb-2 px-1 font-medium ${
                activeTab === "insights"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Insights
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-2 px-1 font-medium ${
                activeTab === "analytics"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Analytics
            </button>
          </div>

          {activeTab === "insights" && (
            <>
              {/* Asset Summary Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Asset Summary</h2>
                <Card className="p-6">
                  <div className="grid grid-cols-3 gap-8">
                    {renderDonutChart(categoryDistribution, totalAssets, "Assets")}
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {categoryDistribution.slice(0, 10).map((item, index) => (
                        <div key={item.name} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{item.name}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {[
                          "Operating System",
                          "Applications",
                          "Availability",
                          "Location",
                          "Warranty",
                          "Model",
                          "Asset Type",
                          "Department",
                          "Cost",
                          "Firmware",
                        ].map((attr) => (
                          <button
                            key={attr}
                            onClick={() => setSelectedAttribute(attr)}
                            className={`px-3 py-1 text-sm whitespace-nowrap rounded ${
                              selectedAttribute === attr
                                ? "bg-blue-100 text-blue-700 font-medium underline"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {attr}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {getSelectedDistribution()
                          .slice(0, 10)
                          .map((item, index) => (
                            <div
                              key={item.name}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                              onClick={() => router.push(getAttributeRoute(selectedAttribute))}
                            >
                              <div
                                className="w-2 h-8 rounded"
                                style={{ backgroundColor: getColor(index, 10) }}
                              ></div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-gray-700">
                                {item.value}
                              </div>
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => router.push(getAttributeRoute(selectedAttribute))}
                      >
                        View All Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Asset Insights Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Asset Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderInsightCard(
                    "Operating System",
                    osDistribution,
                    totalOS,
                    "OS",
                    "/assets/reporting/operating-system"
                  )}
                  {renderInsightCard(
                    "Applications",
                    applicationsDistribution,
                    totalApplications,
                    "Applications",
                    "/assets/reporting/applications"
                  )}
                  {renderInsightCard(
                    "Availability",
                    availabilityDistribution,
                    totalAssets,
                    "Assets",
                    "/assets/reporting/availability"
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "analytics" && (
            <div className="text-center py-12">
              <p className="text-gray-500">Analytics view coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
