/**
 * Shared utility functions for asset dialogs
 */

export function extractData<T>(responseData: T[] | { results: T[] } | undefined): T[] {
  if (!responseData) return []
  return Array.isArray(responseData) ? responseData : (responseData as { results: T[] }).results || []
}

