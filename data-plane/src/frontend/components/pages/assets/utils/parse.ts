// ==================== Parsing Functions ====================

/**
 * Parse string IDs to numbers
 */
export const parseId = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Parse tags string to array of tag IDs
 */
export const parseTags = (tagsString: string): number[] => {
  if (!tagsString || tagsString.trim() === "") return [];
  // If it's already an array, return it
  if (Array.isArray(tagsString))
    return tagsString.map((t) => (typeof t === "number" ? t : parseId(t) || 0)).filter(Boolean);
  // Otherwise, try to parse as comma-separated values or JSON
  try {
    const parsed = JSON.parse(tagsString);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => (typeof t === "number" ? t : parseId(t) || 0)).filter(Boolean);
    }
  } catch {
    // Not JSON, try comma-separated
    return tagsString
      .split(",")
      .map((t) => parseId(t.trim()))
      .filter((id): id is number => id !== null);
  }
  return [];
};

/**
 * Parse departments array
 */
export const parseDepartments = (depts: string[] | number[]): number[] => {
  if (!Array.isArray(depts)) return [];
  return depts
    .map((d) => (typeof d === "number" ? d : parseId(d)))
    .filter((id): id is number => id !== null);
};
