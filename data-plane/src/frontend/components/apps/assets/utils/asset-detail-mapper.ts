/**
 * Centralized mapping from backend asset shape to UI detail view.
 * Maps: asset.category → type, created_at → createdAt, managed_by → teammate, location → location.
 */

import { Asset } from "@/types/assets";

export interface AssetDetailView {
  /** Display type (from category name). */
  type: string;
  /** Created at for display (from created_at). */
  createdAt: string;
  /** Teammate for display (from managed_by). */
  teammate: { userId: string; userName: string } | null;
  /** Location for display (from location). */
  location: { locationId: string; locationName: string } | null;
}

function fullName(obj: { first_name?: string; last_name?: string; username?: string }): string {
  const first = obj.first_name ?? "";
  const last = obj.last_name ?? "";
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return (combined || obj.username) ?? "Unknown";
}

/**
 * Map backend asset to detail view fields used by SystemDetailsSection, CostDepreciationSection, HistorySection, header.
 */
export function mapBackendAssetToDetailView(asset: Asset): AssetDetailView {
  const type = asset.category?.name ?? "Asset";
  const createdAt = asset.created_at ?? "";
  const managedBy = asset.managed_by as { id?: number | string; username?: string; first_name?: string; last_name?: string } | null;
  const teammate =
    managedBy != null
      ? {
          userId: String(managedBy.id ?? ""),
          userName: fullName(managedBy) || (managedBy.username ?? "Unknown"),
        }
      : null;
  const loc = asset.location as { id?: number; name?: string } | null;
  const location =
    loc != null
      ? {
          locationId: String(loc.id ?? ""),
          locationName: loc.name ?? "",
        }
      : null;

  return { type, createdAt, teammate, location };
}
