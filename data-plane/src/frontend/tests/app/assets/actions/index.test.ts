/**
 * Tests for app/(app)/assets/actions/index.ts
 */

import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStats,
  getAssetBasicDetails,
  listAssetTags,
  createAssetTag,
  updateAssetTag,
  deleteAssetTag,
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  listAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
  listCustomLifecycles,
  createCustomLifecycle,
  updateCustomLifecycle,
  deleteCustomLifecycle,
} from "@/app/(app)/assets/actions/index";
import { AssetActions } from "@/app/(app)/assets/actions/AssetActions";
import { TagActions } from "@/app/(app)/assets/actions/TagActions";
import { VendorActions } from "@/app/(app)/assets/actions/VendorActions";
import { CategoryActions } from "@/app/(app)/assets/actions/CategoryActions";
import { LifecycleActions } from "@/app/(app)/assets/actions/LifecycleActions";

// Mock the action classes
jest.mock("@/app/(app)/assets/actions/AssetActions");
jest.mock("@/app/(app)/assets/actions/TagActions");
jest.mock("@/app/(app)/assets/actions/VendorActions");
jest.mock("@/app/(app)/assets/actions/CategoryActions");
jest.mock("@/app/(app)/assets/actions/LifecycleActions");

describe("Asset Actions Index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Asset actions", () => {
    it("listAssets should call AssetActions.list", async () => {
      const mockAssets = [{ id: 1, name: "Asset 1" }];
      (AssetActions.list as jest.Mock).mockResolvedValue(mockAssets);

      const result = await listAssets({ category: 1 });

      expect(AssetActions.list).toHaveBeenCalledWith({ category: 1 });
      expect(result).toEqual(mockAssets);
    });

    it("getAsset should call AssetActions.get", async () => {
      const mockAsset = { id: 1, name: "Asset 1" };
      (AssetActions.get as jest.Mock).mockResolvedValue(mockAsset);

      const result = await getAsset(1);

      expect(AssetActions.get).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAsset);
    });

    it("createAsset should call AssetActions.create", async () => {
      const mockData = { name: "New Asset", category: 1 };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (AssetActions.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createAsset(mockData as any);

      expect(AssetActions.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResult);
    });

    it("updateAsset should call AssetActions.update", async () => {
      const mockData = { name: "Updated Asset" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (AssetActions.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateAsset(1, mockData as any);

      expect(AssetActions.update).toHaveBeenCalledWith(1, mockData);
      expect(result).toEqual(mockResult);
    });

    it("deleteAsset should call AssetActions.delete", async () => {
      const mockResult = { success: true };
      (AssetActions.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await deleteAsset(1);

      expect(AssetActions.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });

    it("getAssetStats should call AssetActions.getStats", async () => {
      const mockStats = { total: 10, active: 5 };
      (AssetActions.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await getAssetStats();

      expect(AssetActions.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it("getAssetBasicDetails should call AssetActions.getBasicDetails", async () => {
      const mockDetails = { name: "Asset", category: 1 };
      (AssetActions.getBasicDetails as jest.Mock).mockResolvedValue(mockDetails as any);

      const result = await getAssetBasicDetails(1);

      expect(AssetActions.getBasicDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDetails);
    });
  });

  describe("Tag actions", () => {
    it("listAssetTags should call TagActions.list", async () => {
      const mockTags = [{ id: 1, name: "Tag 1" }];
      (TagActions.list as jest.Mock).mockResolvedValue(mockTags);

      const result = await listAssetTags();

      expect(TagActions.list).toHaveBeenCalled();
      expect(result).toEqual(mockTags);
    });

    it("createAssetTag should call TagActions.create", async () => {
      const mockData = { name: "New Tag", color: "#FF0000" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (TagActions.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createAssetTag(mockData);

      expect(TagActions.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResult);
    });

    it("updateAssetTag should call TagActions.update", async () => {
      const mockData = { name: "Updated Tag" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (TagActions.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateAssetTag(1, mockData);

      expect(TagActions.update).toHaveBeenCalledWith(1, mockData);
      expect(result).toEqual(mockResult);
    });

    it("deleteAssetTag should call TagActions.delete", async () => {
      const mockResult = { success: true };
      (TagActions.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await deleteAssetTag(1);

      expect(TagActions.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe("Vendor actions", () => {
    it("listVendors should call VendorActions.list", async () => {
      const mockVendors = [{ id: 1, name: "Vendor 1" }];
      (VendorActions.list as jest.Mock).mockResolvedValue(mockVendors);

      const result = await listVendors();

      expect(VendorActions.list).toHaveBeenCalled();
      expect(result).toEqual(mockVendors);
    });

    it("createVendor should call VendorActions.create", async () => {
      const mockData = { name: "New Vendor" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (VendorActions.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createVendor(mockData);

      expect(VendorActions.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResult);
    });

    it("updateVendor should call VendorActions.update", async () => {
      const mockData = { name: "Updated Vendor" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (VendorActions.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateVendor(1, mockData);

      expect(VendorActions.update).toHaveBeenCalledWith(1, mockData);
      expect(result).toEqual(mockResult);
    });

    it("deleteVendor should call VendorActions.delete", async () => {
      const mockResult = { success: true };
      (VendorActions.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await deleteVendor(1);

      expect(VendorActions.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe("Category actions", () => {
    it("listAssetCategories should call CategoryActions.list", async () => {
      const mockCategories = [{ id: 1, name: "Category 1" }];
      (CategoryActions.list as jest.Mock).mockResolvedValue(mockCategories);

      const result = await listAssetCategories();

      expect(CategoryActions.list).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it("createAssetCategory should call CategoryActions.create", async () => {
      const mockData = { name: "New Category" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (CategoryActions.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createAssetCategory(mockData);

      expect(CategoryActions.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResult);
    });

    it("updateAssetCategory should call CategoryActions.update", async () => {
      const mockData = { name: "Updated Category" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (CategoryActions.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateAssetCategory(1, mockData);

      expect(CategoryActions.update).toHaveBeenCalledWith(1, mockData);
      expect(result).toEqual(mockResult);
    });

    it("deleteAssetCategory should call CategoryActions.delete", async () => {
      const mockResult = { success: true };
      (CategoryActions.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await deleteAssetCategory(1);

      expect(CategoryActions.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe("Lifecycle actions", () => {
    it("listCustomLifecycles should call LifecycleActions.list", async () => {
      const mockLifecycles = [{ id: 1, name: "Lifecycle 1" }];
      (LifecycleActions.list as jest.Mock).mockResolvedValue(mockLifecycles);

      const result = await listCustomLifecycles();

      expect(LifecycleActions.list).toHaveBeenCalled();
      expect(result).toEqual(mockLifecycles);
    });

    it("createCustomLifecycle should call LifecycleActions.create", async () => {
      const mockData = { name: "New Lifecycle" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (LifecycleActions.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCustomLifecycle(mockData);

      expect(LifecycleActions.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResult);
    });

    it("updateCustomLifecycle should call LifecycleActions.update", async () => {
      const mockData = { name: "Updated Lifecycle" };
      const mockResult = { success: true, data: { id: 1, ...mockData } };
      (LifecycleActions.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateCustomLifecycle(1, mockData);

      expect(LifecycleActions.update).toHaveBeenCalledWith(1, mockData);
      expect(result).toEqual(mockResult);
    });

    it("deleteCustomLifecycle should call LifecycleActions.delete", async () => {
      const mockResult = { success: true };
      (LifecycleActions.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await deleteCustomLifecycle(1);

      expect(LifecycleActions.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});



