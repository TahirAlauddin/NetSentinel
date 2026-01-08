import { WarrantyStatus } from "@/types/assets";
import { WARRANTY_COLORS } from "@/constants/assets";

/**
 * Get warranty color for a warranty status
 * @param warranty - Warranty status
 * @returns Color hex code
 */
export function getWarrantyColor(warranty: WarrantyStatus | string): string {
  return WARRANTY_COLORS[warranty as WarrantyStatus] || "#6b7280";
}

/**
 * Format warranty status for display
 * @param warranty - Warranty status
 * @returns Formatted string
 */
export function formatWarrantyStatus(warranty: WarrantyStatus | string): string {
  return warranty.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Format asset status for display
 * @param status - Asset status
 * @returns Formatted string
 */
export function formatAssetStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
