/**
 * Filter utilities for assets
 * Provides functions to filter assets based on search terms and status
 */

import { Asset } from "@/types/assets"

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
    const searchLower = searchTerm.toLowerCase().trim()
    filtered = filtered.filter((asset) => {
      // Search in name
      if (asset.name?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in asset tag
      if (asset.asset_tag?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in serial number
      if (asset.serial_number?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in model
      if (asset.model?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in manufacturer
      if (asset.manufacturer?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in IP address
      if (asset.ip_address?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in MAC address
      if (asset.mac_address?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in category name
      if (asset.category?.name?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Search in vendor name
      if (asset.vendor?.name?.toLowerCase().includes(searchLower)) {
        return true
      }

      return false
    })
  }

  return filtered
}

