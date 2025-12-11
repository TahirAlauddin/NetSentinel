"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Asset } from "@/types/assets";
import { listAssets, deleteAsset } from "./actions/index";
import { AssetTable } from "@/components/pages/assets/AssetTable";
import { AssetMetricsDisplay } from "@/components/pages/assets/AssetMetrics";
import { AssetChart } from "@/components/pages/assets/AssetChart";
import { calculateAssetMetrics, filterAssets } from "@/components/pages/assets/utils";

/**
 * AssetsPage component - Main page for asset management
 *
 * Features:
 * - Display asset metrics and charts
 * - List, create, update, and delete assets
 * - Search and filter functionality
 * - Integration with backend API via server actions
 */
export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // ==================== Data Loading ====================

  /**
   * Load assets from the API
   */
  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAssets();
      setAssets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load assets";
      setError(errorMessage);
      console.error("Error loading assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // ==================== Event Handlers ====================
  /**
   * Handle editing an existing asset
   */
  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    router.push(`/assets/edit/${asset.id}`);
  };

  /**
   * Handle deleting an asset
   */
  const handleDeleteAsset = async (id: number) => {
    if (!confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    try {
      setError(null);
      const result = await deleteAsset(id);

      if (result.success) {
        await loadAssets();
      } else {
        setError(result.error || "Failed to delete asset");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete asset";
      setError(errorMessage);
      console.error("Error deleting asset:", err);
    }
  };

  // ==================== Computed Values ====================

  const metrics = calculateAssetMetrics(assets);
  const filteredAssets = filterAssets(assets, searchTerm, filterStatus);

  // ==================== Render ====================

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="text-sm text-gray-600 mb-2">Assets</div>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Search className="w-4 h-4" />
                  Discover
                </Button>
                <Button
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push("/assets/new")}
                >
                  <Plus className="w-4 h-4" />
                  Managed Asset
                </Button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading assets...</div>
            </div>
          ) : (
            <>
              {/* Metrics */}
              <AssetMetricsDisplay
                metrics={metrics}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
              />

              {/* Asset Category Distribution Chart */}
              <AssetChart assets={assets} totalAssets={assets.length} />

              {/* Assets Table */}
              <AssetTable
                assets={filteredAssets}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEditClick={handleEditAsset}
                onDeleteClick={handleDeleteAsset}
              />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
