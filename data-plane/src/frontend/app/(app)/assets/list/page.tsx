"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Edit2, Eye, Trash2, Filter, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Asset } from "@/types/assets";
import { listAssets, deleteAsset } from "../actions/index";
import {
  getWarrantyColor,
  formatWarrantyStatus,
  calculateWarrantyStatus,
} from "@/components/apps/assets/utils";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { AssetFilterDialog } from "@/components/apps/assets/AssetFilterDialog";
import Link from "next/link";

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

  // Load assets
  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAssets();
      setAssets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load assets";
      console.error("[AssetsListPage] Error loading assets:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // Filter assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((asset) => {
        return (
          asset.name?.toLowerCase().includes(searchLower) ||
          asset.asset_tag?.toLowerCase().includes(searchLower) ||
          asset.serial_number?.toLowerCase().includes(searchLower) ||
          asset.model?.toLowerCase().includes(searchLower) ||
          asset.manufacturer?.toLowerCase().includes(searchLower) ||
          asset.ip_address?.toLowerCase().includes(searchLower) ||
          asset.mac_address?.toLowerCase().includes(searchLower) ||
          asset.notes?.toLowerCase().includes(searchLower) ||
          asset.category?.name.toLowerCase().includes(searchLower) ||
          asset.vendor?.name.toLowerCase().includes(searchLower) ||
          asset.location?.name.toLowerCase().includes(searchLower) ||
          asset.assigned_to?.first_name?.toLowerCase().includes(searchLower) ||
          asset.assigned_to?.last_name?.toLowerCase().includes(searchLower) ||
          asset.assigned_to?.username?.toLowerCase().includes(searchLower) ||
          asset.assigned_to?.email?.toLowerCase().includes(searchLower) ||
          `${asset.assigned_to?.first_name || ""} ${asset.assigned_to?.last_name || ""}`.trim().toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((asset) => asset.status === filterStatus);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((asset) =>
        selectedCategories.includes(asset.category?.id.toString() || "")
      );
    }

    return filtered;
  }, [assets, searchTerm, filterStatus, selectedCategories]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedCategories, itemsPerPage]);

  // Handlers
  const handleEditAsset = (asset: Asset) => {
    router.push(`/assets/edit/${asset.id}`);
  };

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

  // Get category names for display
  const getCategoryNames = () => {
    const categoryMap = new Map(
      assets
        .map((asset) => asset.category)
        .filter((cat) => cat)
        .map((cat) => [cat.id.toString(), cat.name])
    );
    return selectedCategories.map((id) => categoryMap.get(id) || id);
  };

  const categoryNames = getCategoryNames();
  const hasCategoryFilters = selectedCategories.length > 0;

  const handleRemoveCategoryFilter = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
  };

  const handleRemoveAllCategoryFilters = () => {
    setSelectedCategories([]);
  };

  const totalFilters = (filterStatus ? 1 : 0) + (hasCategoryFilters ? selectedCategories.length : 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/assets" className="hover:text-foreground hover:underline">
            Assets
          </Link>
          <span>›</span>
          <span className="text-foreground">All</span>
        </nav>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {filteredAssets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
          </p>
        </div>

        {/* Search, Filters, and Controls */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets by name, user, IP address, notes, manufacturer, asset tag, mac address, serial # or model"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Active Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {filterStatus && (
                  <Badge variant="secondary" className="gap-2">
                    Status: {filterStatus}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilterStatus(null)}
                    />
                  </Badge>
                )}
                {hasCategoryFilters && (
                  <>
                    {categoryNames.length <= 2 ? (
                      categoryNames.map((name, index) => {
                        const categoryId = selectedCategories[index];
                        return (
                          <Badge key={categoryId} variant="secondary" className="gap-2">
                            Type: {name}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => handleRemoveCategoryFilter(categoryId)}
                            />
                          </Badge>
                        );
                      })
                    ) : (
                      <Badge variant="secondary" className="gap-2">
                        Type: {categoryNames[0]}, {categoryNames[1]} or {categoryNames.length - 2} More
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={handleRemoveAllCategoryFilters}
                        />
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Filters Button */}
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => setFilterDialogOpen(true)}
              >
                <Filter className="w-4 h-4" />
                Filters
                {totalFilters > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {totalFilters}
                  </span>
                )}
              </Button>

              {/* View Toggle */}
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

              {/* Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number.parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>


        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Assets Table */}
        <Card>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading assets...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input type="checkbox" className="rounded" />
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Warranty Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No assets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAssets.map((asset) => {
                      const warrantyStatus = asset.warranty_expiration
                        ? calculateWarrantyStatus(asset.warranty_expiration)
                        : "no_warranty";

                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <input type="checkbox" className="rounded" />
                          </TableCell>
                          <TableCell>
                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                              <span className="text-xs">•</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>
                            <div className="w-4 h-4 rounded bg-primary/20 cursor-pointer hover:bg-primary/30" />
                          </TableCell>
                          <TableCell className="text-muted-foreground">-</TableCell>
                          <TableCell>
                            {asset.warranty_expiration ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: getWarrantyColor(warrantyStatus),
                                  }}
                                />
                                <span className="text-sm">{formatWarrantyStatus(warrantyStatus)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                                <span className="text-sm text-muted-foreground">No warranty info</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAsset(asset)}
                                className="gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/assets/${asset.id}`)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredAssets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Filter Dialog */}
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
  );
}
