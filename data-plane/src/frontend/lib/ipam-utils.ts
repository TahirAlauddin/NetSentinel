/**
 * IPAM utility functions
 * Helper functions for working with IPAM data
 */


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

