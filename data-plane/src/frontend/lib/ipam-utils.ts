/**
 * IPAM utility functions
 * Helper functions for working with IPAM data
 */

import { Subnet, VLAN, VRF, Customer } from "@/types/ipam";
import { PaginatedResponse } from "@/types/ipam/dto";

/**
 * Extract array data from API response
 * Handles both array responses and paginated responses
 */
export function extractIpamArrayData<T>(
  data: T[] | PaginatedResponse<T> | null | undefined
): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === "object" && "results" in data && Array.isArray(data.results)) {
    return data.results;
  }

  console.warn("Unexpected IPAM data format:", data);
  return [];
}

