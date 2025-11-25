// ==================== Filter Functions ====================

import { Asset } from "@/types/assets";

/**
 * Filter assets by search term and status
 * @param assets - Array of asset records
 * @param searchTerm - Search term to filter by
 * @param filterStatus - Status filter (optional)
 * @returns Filtered array of assets
 */
export function filterAssets(
  assets: Asset[],
  searchTerm: string,
  filterStatus: string | null
): Asset[] {
  const searchLower = searchTerm.toLowerCase();

  return assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchLower) ||
      asset.asset_tag?.toLowerCase().includes(searchLower) ||
      asset.category?.name?.toLowerCase().includes(searchLower) ||
      asset.vendor?.name?.toLowerCase().includes(searchLower) ||
      asset.location?.toString().toLowerCase().includes(searchLower) ||
      asset.warranty_expiration?.toLowerCase().includes(searchLower);

    const matchesStatus = !filterStatus || asset.status === filterStatus;

    return matchesSearch && matchesStatus;
  });
}
