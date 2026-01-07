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
export function extractIpamArrayData<T>(data: unknown): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (typeof data === "object" && data !== null && "results" in data && Array.isArray((data as { results: unknown }).results)) {
    return (data as { results: T[] }).results;
  }

  console.warn("Unexpected IPAM data format:", data);
  return [];
}

