"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Asset } from "@/types/assets";
import { listAssets, deleteAsset } from "../actions/index";
import { assetMatchesSearch } from "@/components/apps/assets/utils";
import { ViewMode } from "@/components/ui/view-toggle";
import { Pagination } from "@/components/ui/pagination";
import { AssetFilterDialog } from "@/components/apps/assets/AssetFilterDialog";
import { AssetsDashboardNav } from "@/components/apps/assets/AssetsDashboardNav";
import { AssetsListSearchSection } from "@/components/apps/assets/AssetsListSearchSection";
import { AssetsListTable } from "@/components/apps/assets/AssetsListTable";
import Link from "next/link";
import { ProtectedRoute } from "@/components/feedback/protected-route";

function getCategoryFilterBadges(
  assets: Asset[],
  selectedCategoryIds: string[]
): { id: string; name: string }[] {
  const categoryMap = new Map(
    assets
      .map((asset) => asset.category)
      .filter((cat) => cat)
      .map((cat) => [cat.id.toString(), cat.name])
  );
  return selectedCategoryIds.map((id) => ({
    id,
    name: categoryMap.get(id) ?? id,
  }));
}

function getPaginationSlice<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export default function AssetsListPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAssets();
      setAssets(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load assets";
      console.error("[AssetsListPage] Error loading assets:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    let result = assets;

    if (searchTerm.trim()) {
      result = result.filter((asset) => assetMatchesSearch(asset, searchTerm));
    }
    if (filterStatus) {
      result = result.filter((asset) => asset.status === filterStatus);
    }
    if (selectedCategories.length > 0) {
      result = result.filter((asset) =>
        selectedCategories.includes(asset.category?.id.toString() ?? "")
      );
    }

    return result;
  }, [assets, searchTerm, filterStatus, selectedCategories]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = useMemo(
    () => getPaginationSlice(filteredAssets, currentPage, itemsPerPage),
    [filteredAssets, currentPage, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedCategories, itemsPerPage]);

  const handleEditAsset = useCallback(
    (asset: Asset) => {
      router.push(`/assets/edit/${asset.id}`);
    },
    [router]
  );

  const handleViewAsset = useCallback(
    (asset: Asset) => {
      router.push(`/assets/${asset.id}`);
    },
    [router]
  );

  const handleDeleteAsset = useCallback(
    async (id: number) => {
      if (!confirm("Are you sure you want to delete this asset?")) return;

      try {
        setError(null);
        const result = await deleteAsset(id);
        if (result.success) {
          await loadAssets();
        } else {
          setError(result.error ?? "Failed to delete asset");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete asset";
        setError(errorMessage);
        console.error("Error deleting asset:", err);
      }
    },
    [loadAssets]
  );

  const categoryFilterBadges = useMemo(
    () => getCategoryFilterBadges(assets, selectedCategories),
    [assets, selectedCategories]
  );
  const totalFilters =
    (filterStatus ? 1 : 0) + (selectedCategories.length > 0 ? selectedCategories.length : 0);

  const handleRemoveCategoryFilter = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  }, []);

  const handleRemoveAllCategoryFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const paginationStart =
    filteredAssets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const paginationEnd = Math.min(
    currentPage * itemsPerPage,
    filteredAssets.length
  );

  return (
    <ProtectedRoute>
      <AppShell>
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/assets" className="hover:text-foreground hover:underline">
            Assets
          </Link>
          <span>›</span>
          <span className="text-foreground">All</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {paginationStart}-{paginationEnd} of {filteredAssets.length}{" "}
            assets
          </p>
        </div>

        <AssetsDashboardNav />

        <AssetsListSearchSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusClear={() => setFilterStatus(null)}
          categoryFilters={categoryFilterBadges}
          onRemoveCategoryFilter={handleRemoveCategoryFilter}
          onRemoveAllCategoryFilters={handleRemoveAllCategoryFilters}
          totalFilters={totalFilters}
          onFiltersClick={() => setFilterDialogOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        />

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <AssetsListTable
          assets={paginatedAssets}
          loading={loading}
          onEdit={handleEditAsset}
          onView={handleViewAsset}
          onDelete={handleDeleteAsset}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAssets.length}
          pageStart={paginationStart}
          pageEnd={paginationEnd}
          onPageChange={setCurrentPage}
          itemLabel="assets"
        />

        <AssetFilterDialog
          open={filterDialogOpen}
          onOpenChange={setFilterDialogOpen}
          assets={assets}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
        />
      </div>
      </AppShell>
    </ProtectedRoute>
  );
}
