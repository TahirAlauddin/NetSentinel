"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Asset } from "@/types/assets";
import { listAssets } from "../actions/index";
import { AssetsDashboardNav } from "@/components/apps/assets/AssetsDashboardNav";
import { ReportingInsightsSection } from "@/components/apps/assets/reporting/ReportingInsightsSection";
import { InsightDetailModal } from "@/components/apps/assets/reporting/InsightDetailModal";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import {
  calculateCategoryDistribution,
  calculateOSDistribution,
  calculateApplicationsDistribution,
  calculateLocationDistribution,
  calculateWarrantyDistribution,
  calculateModelDistribution,
  calculateDepartmentDistribution,
  calculateCostDistribution,
  calculateFirmwareDistribution,
} from "@/components/apps/assets/utils/calculate";

type InsightTitle =
  | "Operating System"
  | "Applications"
  | "Location"
  | "Warranty"
  | "Model"
  | "Asset Type"
  | "Department"
  | "Cost"
  | "Firmware";

const INSIGHT_TOTAL_LABEL: Record<InsightTitle, string> = {
  "Operating System": "OS",
  Applications: "Applications",
  Location: "Assets",
  Warranty: "Assets",
  Model: "Assets",
  "Asset Type": "Assets",
  Department: "Assets",
  Cost: "Assets",
  Firmware: "Assets",
};

/**
 * Asset Reporting Page - Main reporting dashboard with insights
 */
export default function AssetReportingPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const [openInsight, setOpenInsight] = useState<InsightTitle | null>(null);

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

  const categoryDistribution = calculateCategoryDistribution(assets);
  const osDistribution = calculateOSDistribution(assets);
  const applicationsDistribution = calculateApplicationsDistribution(assets);
  const locationDistribution = calculateLocationDistribution(assets);
  const warrantyDistribution = calculateWarrantyDistribution(assets);
  const modelDistribution = calculateModelDistribution(assets);
  const departmentDistribution = calculateDepartmentDistribution(assets);
  const costDistribution = calculateCostDistribution(assets);
  const firmwareDistribution = calculateFirmwareDistribution(assets);

  const totalAssets = assets.length;
  const totalOS = osDistribution.reduce((sum, item) => sum + item.value, 0);
  const totalApplications = applicationsDistribution.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const categoryDistributionWithAssets = useMemo(
    () =>
      categoryDistribution.map((c) => ({
        name: c.name,
        value: c.value,
        assets: assets.filter(
          (a) =>
            (c.id != null && a.category?.id?.toString() === c.id) ||
            ((c.id == null || c.id === "") &&
              (a.category?.name ?? "Uncategorized") === c.name)
        ),
      })),
    [categoryDistribution, assets]
  );

  const getDistributionForModal = (insight: string) => {
    switch (insight) {
      case "Operating System":
        return osDistribution;
      case "Applications":
        return applicationsDistribution;
      case "Location":
        return locationDistribution;
      case "Warranty":
        return warrantyDistribution;
      case "Model":
        return modelDistribution;
      case "Asset Type":
        return categoryDistributionWithAssets;
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

  const handleExport = () => {
    console.warn("Export not implemented");
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading reporting data...</div>
              </div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Assets &gt; Insights</div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Asset Reporting</h1>
            </div>

            <AssetsDashboardNav
              onOpenReportingInsight={(title) => setOpenInsight(title as InsightTitle)}
              activeReportingInsight={openInsight}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab("insights")}
              className={`pb-2 px-1 font-medium ${
                activeTab === "insights"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Insights
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`pb-2 px-1 font-medium ${
                activeTab === "analytics"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Analytics
            </button>
          </div>

          {activeTab === "insights" && (
            <>
              <ReportingInsightsSection
                assets={assets}
                categoryDistribution={categoryDistribution}
                osDistribution={osDistribution}
                applicationsDistribution={applicationsDistribution}
                locationDistribution={locationDistribution}
                warrantyDistribution={warrantyDistribution}
                modelDistribution={modelDistribution}
                departmentDistribution={departmentDistribution}
                costDistribution={costDistribution}
                firmwareDistribution={firmwareDistribution}
                totalAssets={totalAssets}
                totalOS={totalOS}
                totalApplications={totalApplications}
                onOpenInsight={(attr) => setOpenInsight(attr as InsightTitle)}
              />
              {openInsight && (
                <InsightDetailModal
                  open={true}
                  onOpenChange={(open) => !open && setOpenInsight(null)}
                  title={openInsight}
                  distribution={getDistributionForModal(openInsight)}
                  totalLabel={INSIGHT_TOTAL_LABEL[openInsight]}
                  onExport={handleExport}
                />
              )}
            </>
          )}

          {activeTab === "analytics" && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Analytics view coming soon...</p>
            </div>
          )}
        </div>
      </div>
      </AppShell>
    </ProtectedRoute>
  );
}
