/**
 * Utility functions for asset calculations and formatting
 */

import { Asset, AssetMetrics } from "@/types/assets";
import { WarrantyStatus } from "@/types/assets";

// ==================== Calculation Functions ====================

/**
 * Calculate warranty status based on expiry date
 * @param warrantyExpiry - Warranty expiry date string (YYYY-MM-DD)
 * @returns Warranty status
 */
export function calculateWarrantyStatus(warrantyExpiry: string | null | undefined): WarrantyStatus {
  if (!warrantyExpiry) {
    return "no_warranty";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(warrantyExpiry);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return "expired";
  }

  if (daysUntilExpiry <= 30) {
    return "expiring_soon";
  }

  return "in_warranty";
}

/**
 * Calculate asset metrics from asset list
 * @param assets - Array of asset records
 * @returns Asset metrics object
 */
export function calculateAssetMetrics(assets: Asset[]): AssetMetrics {
  const metrics: AssetMetrics = {
    total: assets.length,
    active: 0,
    retired: 0,
    in_repair: 0,
    disposed: 0,
  };

  assets.forEach((asset) => {
    switch (asset.status) {
      case "active":
        metrics.active++;
        break;
      case "retired":
        metrics.retired++;
        break;
      case "in_repair":
        metrics.in_repair++;
        break;
      case "disposed":
        metrics.disposed++;
        break;
    }
  });

  return metrics;
}

/**
 * Calculate category distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of category distribution data
 */
export function calculateCategoryDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; id?: string }> {
  const distribution = new Map<string, { count: number; id?: string }>();

  assets.forEach((asset) => {
    const categoryName = asset.category?.name || "Uncategorized";
    const categoryId = asset.category?.id?.toString();
    const existing = distribution.get(categoryName);
    if (existing) {
      existing.count += 1;
    } else {
      distribution.set(categoryName, { count: 1, id: categoryId });
    }
  });

  return Array.from(distribution.entries()).map(([name, data]) => ({
    name,
    value: data.count,
    id: data.id,
  }));
}
