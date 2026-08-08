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

/**
 * Extract total count from API response payload.
 * Supports paginated ({ count, results }) and plain array responses.
 */
export function extractIpamCount(data: unknown): number {
  if (!data) {
    return 0;
  }

  if (typeof data === "object" && data !== null && "count" in data) {
    const rawCount = (data as { count?: unknown }).count;
    if (typeof rawCount === "number" && Number.isFinite(rawCount)) {
      return rawCount;
    }
    if (typeof rawCount === "string") {
      const parsed = Number(rawCount);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return extractIpamArrayData<unknown>(data).length;
}

