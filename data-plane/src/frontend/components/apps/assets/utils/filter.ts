/**
 * Filter utilities for assets
 * Provides functions to filter assets based on search terms and status
 */

import { Asset } from "@/types/assets"

/**
 * Recursively collects all string (and stringifiable) values from a value for search.
 * Handles nested objects and arrays so any attribute can be matched dynamically.
 */
function getSearchableStrings(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(getSearchableStrings)
  if (typeof value === "object" && value !== null && !(value instanceof Date)) {
    return Object.values(value).flatMap(getSearchableStrings)
  }
  if (typeof value === "number" || typeof value === "boolean") return [String(value)]
  return []
}

/**
 * Returns true if any attribute on the asset (including nested) contains the search term (case-insensitive).
 * Dynamically searches every string/number field without hardcoding field names.
 */
export function assetMatchesSearch(asset: Asset, searchTerm: string): boolean {
  const searchLower = searchTerm.trim().toLowerCase()
  if (!searchLower) return true
  const strings = getSearchableStrings(asset)
  return strings.some((s) => s.toLowerCase().includes(searchLower))
}

/**
 * Filters assets based on search term and status
 *
 * @param assets - Array of assets to filter
 * @param searchTerm - Search term to match against asset name, tag, serial number, etc.
 * @param filterStatus - Status to filter by (active, retired, in_repair, disposed) or null for all
 * @returns Filtered array of assets
 */
export function filterAssets(
  assets: Asset[],
  searchTerm: string,
  filterStatus: string | null
): Asset[] {
  let filtered = assets

  // Filter by status if provided
  if (filterStatus) {
    filtered = filtered.filter((asset) => asset.status === filterStatus)
  }

  // Filter by search term if provided
  if (searchTerm && searchTerm.trim() !== "") {
    filtered = filtered.filter((asset) => assetMatchesSearch(asset, searchTerm))
  }

  return filtered
}

