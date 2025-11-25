import { Vendor } from "@/types/assets";

// ==================== Normalization Functions ====================

/**
 * Normalize vendor data
 */
export const normalizeVendor = (vendor: Vendor | number | string | null): Vendor | null => {
  if (vendor === null) return null;

  if (typeof vendor === "number") return { id: vendor, name: "" };
  if (typeof vendor === "string") return { id: parseInt(vendor, 10), name: "" };
  return vendor;
};

/**
 * Normalize the tags data
 * Converts tag objects to IDs
 * @param tags - The tags data to normalize
 * @returns The normalized tags data
 */
export const normalizeTags = (tags: any[]): number[] => {
  return tags
    .map((tag: any) => {
      if (typeof tag === "number") return tag;
      if (typeof tag === "object" && tag !== null && "id" in tag) {
        return tag.id;
      }
      return null;
    })
    .filter((id: any): id is number => typeof id === "number");
};
