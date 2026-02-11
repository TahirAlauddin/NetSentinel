"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Asset } from "@/types/assets";
import { listAssets } from "../../actions/index";
import { calculateApplicationsDistribution } from "@/components/apps/assets/utils/calculate";
import { InsightDetailPage } from "@/components/apps/assets/reporting/InsightDetailPage";

export default function ApplicationsDetailPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center py-12">
              <div className="text-gray-500">Loading data...</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const distribution = calculateApplicationsDistribution(assets);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.warn("Exporting applications data...");
  };

  return (
    <AppShell>
      <InsightDetailPage
        title="Applications"
        distribution={distribution}
        totalLabel="Applications"
        onExport={handleExport}
      />
    </AppShell>
  );
}
