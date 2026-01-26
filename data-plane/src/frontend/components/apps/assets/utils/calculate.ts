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

/**
 * Calculate operating system distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of OS distribution data
 */
export function calculateOSDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    // Try to get OS from computer_details first
    const os = asset.computer_details?.os || "Unknown";
    const existing = distribution.get(os);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(os, { count: 1, assets: [asset] });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate applications distribution from asset list
 * Note: Applications are extracted from notes field (comma-separated or newline-separated)
 * @param assets - Array of asset records
 * @returns Array of application distribution data
 */
export function calculateApplicationsDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    // Extract applications from notes field
    // This is a simplified approach - in a real system, applications might be stored separately
    const notes = asset.notes || "";
    const applications = notes
      .split(/[,\n]/)
      .map((app) => app.trim())
      .filter((app) => app.length > 0 && app.length < 100); // Filter out very long strings

    if (applications.length === 0) {
      const unknown = distribution.get("Unknown") || { count: 0, assets: [] };
      unknown.count += 1;
      unknown.assets.push(asset);
      distribution.set("Unknown", unknown);
    } else {
      applications.forEach((app) => {
        const existing = distribution.get(app);
        if (existing) {
          existing.count += 1;
          if (!existing.assets.includes(asset)) {
            existing.assets.push(asset);
          }
        } else {
          distribution.set(app, { count: 1, assets: [asset] });
        }
      });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate availability/status distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of availability distribution data
 */
export function calculateAvailabilityDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const statusMap: Record<string, string> = {
    active: "In Use",
    retired: "Retired",
    in_repair: "In Repair",
    disposed: "Disposed",
  };

  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    const statusLabel = statusMap[asset.status] || asset.status;
    const existing = distribution.get(statusLabel);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(statusLabel, { count: 1, assets: [asset] });
    }
  });

  // Add "Ready to Use" and "Needs Attention" based on status
  const readyToUse = assets.filter((a) => a.status === "active" && !a.assigned_to);
  if (readyToUse.length > 0) {
    distribution.set("Ready to Use", { count: readyToUse.length, assets: readyToUse });
  }

  const needsAttention = assets.filter(
    (a) => a.status === "in_repair" || (a.warranty_expiration && calculateWarrantyStatus(a.warranty_expiration) === "expiring_soon")
  );
  if (needsAttention.length > 0) {
    distribution.set("Needs Attention", { count: needsAttention.length, assets: needsAttention });
  }

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate location distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of location distribution data
 */
export function calculateLocationDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    const locationName = asset.location?.name || "Unknown";
    const existing = distribution.get(locationName);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(locationName, { count: 1, assets: [asset] });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate warranty distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of warranty distribution data
 */
export function calculateWarrantyDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    const warrantyStatus = calculateWarrantyStatus(asset.warranty_expiration);
    const statusLabel =
      warrantyStatus === "in_warranty"
        ? "In Warranty"
        : warrantyStatus === "expiring_soon"
          ? "Expiring soon"
          : warrantyStatus === "expired"
            ? "Expired"
            : "No Warranty";

    const existing = distribution.get(statusLabel);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(statusLabel, { count: 1, assets: [asset] });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate model distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of model distribution data
 */
export function calculateModelDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    const modelName = asset.model || "Unknown";
    const existing = distribution.get(modelName);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(modelName, { count: 1, assets: [asset] });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate department distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of department distribution data
 */
export function calculateDepartmentDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    if (asset.departments && asset.departments.length > 0) {
      asset.departments.forEach((dept) => {
        const deptName = dept.name || "Unknown";
        const existing = distribution.get(deptName);
        if (existing) {
          existing.count += 1;
          if (!existing.assets.includes(asset)) {
            existing.assets.push(asset);
          }
        } else {
          distribution.set(deptName, { count: 1, assets: [asset] });
        }
      });
    } else {
      const unknown = distribution.get("No Department") || { count: 0, assets: [] };
      unknown.count += 1;
      unknown.assets.push(asset);
      distribution.set("No Department", unknown);
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate cost distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of cost range distribution data
 */
export function calculateCostDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    const cost = asset.purchase_price ? parseFloat(asset.purchase_price) : null;
    let range = "Unknown";

    if (cost !== null && !isNaN(cost)) {
      if (cost < 100) {
        range = "$0 - $100";
      } else if (cost < 500) {
        range = "$100 - $500";
      } else if (cost < 1000) {
        range = "$500 - $1,000";
      } else if (cost < 5000) {
        range = "$1,000 - $5,000";
      } else {
        range = "$5,000+";
      }
    }

    const existing = distribution.get(range);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(range, { count: 1, assets: [asset] });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => {
      // Sort by cost range order
      const order = ["$0 - $100", "$100 - $500", "$500 - $1,000", "$1,000 - $5,000", "$5,000+", "Unknown"];
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return b.value - a.value;
    });
}

/**
 * Calculate firmware distribution from asset list
 * @param assets - Array of asset records
 * @returns Array of firmware distribution data
 */
export function calculateFirmwareDistribution(
  assets: Asset[]
): Array<{ name: string; value: number; assets: Asset[] }> {
  const distribution = new Map<string, { count: number; assets: Asset[] }>();

  assets.forEach((asset) => {
    // Try to get firmware from network_details
    const firmware = asset.network_details?.firmware || "Unknown";
    const existing = distribution.get(firmware);
    if (existing) {
      existing.count += 1;
      existing.assets.push(asset);
    } else {
      distribution.set(firmware, { count: 1, assets: [asset] });
    }
  });

  return Array.from(distribution.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      assets: data.assets,
    }))
    .sort((a, b) => b.value - a.value);
}
