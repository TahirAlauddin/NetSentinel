/**
 * Unit tests for components/pages/assets/utils/format.ts
 */

import {
  getWarrantyColor,
  formatWarrantyStatus,
  formatAssetStatus,
} from "@/components/pages/assets/utils/format";
import { WarrantyStatus } from "@/types/assets";

describe('Asset Format Utils', () => {
  describe('getWarrantyColor', () => {
    it('should return correct color for "in_warranty" status', () => {
      expect(getWarrantyColor("in_warranty")).toBe("#06b6d4");
    });

    it('should return correct color for "expiring_soon" status', () => {
      expect(getWarrantyColor("expiring_soon")).toBe("#f97316");
    });

    it('should return correct color for "expired" status', () => {
      expect(getWarrantyColor("expired")).toBe("#dc2626");
    });

    it('should return correct color for "no_warranty" status', () => {
      expect(getWarrantyColor("no_warranty")).toBe("#6b7280");
    });

    it('should return default color for unknown status', () => {
      expect(getWarrantyColor("unknown_status" as WarrantyStatus)).toBe("#6b7280");
    });

    it('should handle string type warranty status', () => {
      expect(getWarrantyColor("in_warranty" as string)).toBe("#06b6d4");
    });
  });

  describe('formatWarrantyStatus', () => {
    it('should format "in_warranty" to "In Warranty"', () => {
      expect(formatWarrantyStatus("in_warranty")).toBe("In Warranty");
    });

    it('should format "expiring_soon" to "Expiring Soon"', () => {
      expect(formatWarrantyStatus("expiring_soon")).toBe("Expiring Soon");
    });

    it('should format "expired" to "Expired"', () => {
      expect(formatWarrantyStatus("expired")).toBe("Expired");
    });

    it('should format "no_warranty" to "No Warranty"', () => {
      expect(formatWarrantyStatus("no_warranty")).toBe("No Warranty");
    });

    it('should handle multiple underscores', () => {
      expect(formatWarrantyStatus("expiring_soon" as string)).toBe("Expiring Soon");
    });

    it('should capitalize first letter of each word', () => {
      expect(formatWarrantyStatus("test_status" as string)).toBe("Test Status");
    });

    it('should handle single word status', () => {
      expect(formatWarrantyStatus("active" as string)).toBe("Active");
    });
  });

  describe('formatAssetStatus', () => {
    it('should format "active" to "Active"', () => {
      expect(formatAssetStatus("active")).toBe("Active");
    });

    it('should format "retired" to "Retired"', () => {
      expect(formatAssetStatus("retired")).toBe("Retired");
    });

    it('should format "in_repair" to "In Repair"', () => {
      expect(formatAssetStatus("in_repair")).toBe("In Repair");
    });

    it('should format "disposed" to "Disposed"', () => {
      expect(formatAssetStatus("disposed")).toBe("Disposed");
    });

    it('should format status with underscores', () => {
      expect(formatAssetStatus("ready_to_use")).toBe("Ready To Use");
    });

    it('should capitalize first letter of each word', () => {
      expect(formatAssetStatus("needs_attention")).toBe("Needs Attention");
    });

    it('should handle single word status', () => {
      expect(formatAssetStatus("active")).toBe("Active");
    });

    it('should handle empty string', () => {
      expect(formatAssetStatus("")).toBe("");
    });
  });
})

