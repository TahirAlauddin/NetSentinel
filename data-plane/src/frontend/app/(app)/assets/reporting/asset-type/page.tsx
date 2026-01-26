"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Asset } from "@/types/assets";
import { listAssets } from "../../actions/index";
import { calculateCategoryDistribution } from "@/components/apps/assets/utils/calculate";
import { InsightDetailPage } from "@/components/apps/assets/reporting/InsightDetailPage";

// Create a wrapper to convert category distribution to the format needed
function convertCategoryDistribution(
  categoryDist: Array<{ name: string; value: number; id?: string }>,
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  return categoryDist.map((cat) => ({
    name: cat.name,
    value: cat.value,
    assets: assets.filter((asset) => asset.category?.name === cat.name),
  }));
}

export default function AssetTypeDetailPage() {
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

  const categoryDist = calculateCategoryDistribution(assets);
  const distribution = convertCategoryDistribution(categoryDist, assets);

  const handleExport = () => {
    console.log("Exporting asset type data...");
  };

  return (
    <AppShell>
      <InsightDetailPage
        title="Asset Type"
        distribution={distribution}
        totalLabel="Assets"
        onExport={handleExport}
      />
    </AppShell>
  );
}
