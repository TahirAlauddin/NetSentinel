/**
 * Unit tests for components/pages/assets/utils/calculate.ts
 */

import {
  calculateWarrantyStatus,
  calculateAssetMetrics,
  calculateCategoryDistribution,
} from "@/components/apps/assets/utils/calculate";
import { Asset } from "@/types/assets";
import { mockAsset, mockAssetCategory } from "@/tests/__fixtures__/api-responses";

describe('Asset Calculate Utils', () => {
  describe('calculateWarrantyStatus', () => {
    it('should return "no_warranty" when warranty expiry is null', () => {
      expect(calculateWarrantyStatus(null)).toBe("no_warranty");
    });

    it('should return "no_warranty" when warranty expiry is undefined', () => {
      expect(calculateWarrantyStatus(undefined)).toBe("no_warranty");
    });

    it('should return "expired" when warranty has passed', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expiryDate = yesterday.toISOString().split('T')[0];
      
      expect(calculateWarrantyStatus(expiryDate)).toBe("expired");
    });

    it('should return "expiring_soon" when warranty expires within 30 days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 15);
      const expiryDate = tomorrow.toISOString().split('T')[0];
      
      expect(calculateWarrantyStatus(expiryDate)).toBe("expiring_soon");
    });

    it('should return "expiring_soon" when warranty expires exactly in 30 days', () => {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const expiryDate = in30Days.toISOString().split('T')[0];
      
      expect(calculateWarrantyStatus(expiryDate)).toBe("expiring_soon");
    });

    it('should return "in_warranty" when warranty expires in more than 30 days', () => {
      const in60Days = new Date();
      in60Days.setDate(in60Days.getDate() + 60);
      const expiryDate = in60Days.toISOString().split('T')[0];
      
      expect(calculateWarrantyStatus(expiryDate)).toBe("in_warranty");
    });

    it('should return "expired" when warranty expires today', () => {
      const today = new Date();
      const expiryDate = today.toISOString().split('T')[0];
      
      expect(calculateWarrantyStatus(expiryDate)).toBe("expiring_soon");
    });
  });

  describe('calculateAssetMetrics', () => {
    it('should calculate metrics for empty asset array', () => {
      const metrics = calculateAssetMetrics([]);
      
      expect(metrics).toEqual({
        total: 0,
        active: 0,
        retired: 0,
        in_repair: 0,
        disposed: 0,
      });
    });

    it('should calculate metrics for assets with different statuses', () => {
      const assets: Asset[] = [
        { ...mockAsset, id: 1, status: "active" },
        { ...mockAsset, id: 2, status: "active" },
        { ...mockAsset, id: 3, status: "retired" },
        { ...mockAsset, id: 4, status: "in_repair" },
        { ...mockAsset, id: 5, status: "disposed" },
        { ...mockAsset, id: 6, status: "active" },
      ];

      const metrics = calculateAssetMetrics(assets);
      
      expect(metrics).toEqual({
        total: 6,
        active: 3,
        retired: 1,
        in_repair: 1,
        disposed: 1,
      });
    });

    it('should handle assets with only one status', () => {
      const assets: Asset[] = [
        { ...mockAsset, id: 1, status: "active" },
        { ...mockAsset, id: 2, status: "active" },
        { ...mockAsset, id: 3, status: "active" },
      ];

      const metrics = calculateAssetMetrics(assets);
      
      expect(metrics).toEqual({
        total: 3,
        active: 3,
        retired: 0,
        in_repair: 0,
        disposed: 0,
      });
    });
  });

  describe('calculateCategoryDistribution', () => {
    it('should calculate distribution for empty asset array', () => {
      const distribution = calculateCategoryDistribution([]);
      
      expect(distribution).toEqual([]);
    });

    it('should calculate distribution for assets with different categories', () => {
      const category1 = { ...mockAssetCategory, id: 1, name: "Laptop" };
      const category2 = { ...mockAssetCategory, id: 2, name: "Desktop" };
      const category3 = { ...mockAssetCategory, id: 3, name: "Server" };

      const assets: Asset[] = [
        { ...mockAsset, id: 1, category: category1 },
        { ...mockAsset, id: 2, category: category1 },
        { ...mockAsset, id: 3, category: category2 },
        { ...mockAsset, id: 4, category: category3 },
        { ...mockAsset, id: 5, category: category1 },
      ];

      const distribution = calculateCategoryDistribution(assets);
      
      expect(distribution).toHaveLength(3);
      expect(distribution).toContainEqual({ name: "Laptop", value: 3 });
      expect(distribution).toContainEqual({ name: "Desktop", value: 1 });
      expect(distribution).toContainEqual({ name: "Server", value: 1 });
    });

    it('should handle assets with null category as "Uncategorized"', () => {
      const assets: Asset[] = [
        { ...mockAsset, id: 1, category: mockAssetCategory },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...mockAsset, id: 2, category: null as any },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...mockAsset, id: 3, category: null as any },
      ];

      const distribution = calculateCategoryDistribution(assets);
      
      expect(distribution).toHaveLength(2);
      expect(distribution).toContainEqual({ name: "Test Category", value: 1 });
      expect(distribution).toContainEqual({ name: "Uncategorized", value: 2 });
    });

    it('should handle assets with category without name', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoryWithoutName = { ...mockAssetCategory, name: undefined as any };
      const assets: Asset[] = [
        { ...mockAsset, id: 1, category: categoryWithoutName },
      ];

      const distribution = calculateCategoryDistribution(assets);
      
      expect(distribution).toContainEqual({ name: "Uncategorized", value: 1 });
    });
  });
})

