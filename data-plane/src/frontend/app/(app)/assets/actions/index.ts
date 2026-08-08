"use server";

// Import classes (not exported - internal use only)
import { AssetActions } from "./AssetActions";
import { TagActions } from "./TagActions";
import { VendorActions } from "./VendorActions";
import { CategoryActions } from "./CategoryActions";
import { LifecycleActions } from "./LifecycleActions";
import { AssetCreateDto, AssetUpdateDto } from "@/types/assets/dto";
import { Asset } from "@/types/assets/asset";
import { Tag } from "@/types/assets/fields";
import { Vendor } from "@/types/assets/fields";
import { Category } from "@/types/assets/fields";
import { CustomLifecycle } from "@/types/assets/fields";
import { AssetStats } from "@/types/assets";
import { BasicDetailsStepFormData } from "@/types/assets/steps";
// ==================== Assets ====================

export async function getAssetBasicDetails(id: number): Promise<BasicDetailsStepFormData> {
  return AssetActions.getBasicDetails(id);
}

export async function listAssets(params?: {
  category?: number;
  status?: string;
  vendor?: number;
  location?: number;
  search?: string;
}): Promise<Asset[]> {
  return AssetActions.list(params);
}

export async function getAsset(id: number): Promise<Asset> {
  return AssetActions.get(id);
}

export async function createAsset(
  data: AssetCreateDto
): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
  return AssetActions.create(data);
}

export async function updateAsset(
  id: number,
  data: AssetUpdateDto
): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
  return AssetActions.update(id, data);
}

export async function deleteAsset(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  return AssetActions.delete(id);
}

export async function getAssetStats(): Promise<AssetStats> {
  return AssetActions.getStats();
}

export async function uploadAssetImages(
  assetId: number,
  images: (File | string | { image?: string })[]
): Promise<{ success: boolean; error?: string }> {
  return AssetActions.uploadImages(assetId, images);
}

export async function uploadAssetAttachments(
  assetId: number,
  attachments: (File | string | { file?: string })[]
): Promise<{ success: boolean; error?: string }> {
  return AssetActions.uploadAttachments(assetId, attachments);
}

export async function setAssetRelations(
  assetId: number,
  relatedItems: number[]
): Promise<{ success: boolean; error?: string }> {
  return AssetActions.setRelations(assetId, relatedItems);
}

// ==================== Asset Tags ====================

export async function listAssetTags(): Promise<Tag[]> {
  return TagActions.list();
}

export async function createAssetTag(data: {
  name: string;
  color?: string;
}): Promise<{ success: boolean; data?: Tag; error?: string }> {
  return TagActions.create(data);
}

export async function updateAssetTag(
  id: number,
  data: { name?: string; color?: string }
): Promise<{ success: boolean; data?: Tag; error?: string }> {
  return TagActions.update(id, data);
}

export async function deleteAssetTag(id: number): Promise<{ success: boolean; error?: string }> {
  return TagActions.delete(id);
}

// ==================== Vendors ====================

export async function listVendors(): Promise<Vendor[]> {
  return VendorActions.list();
}

export async function createVendor(data: {
  name: string;
  contact_info?: string;
  website?: string;
}): Promise<{ success: boolean; data?: Vendor; error?: string }> {
  return VendorActions.create(data);
}

export async function updateVendor(
  id: number,
  data: { name?: string; contact_info?: string; website?: string }
): Promise<{ success: boolean; data?: Vendor; error?: string }> {
  return VendorActions.update(id, data);
}

export async function deleteVendor(id: number): Promise<{ success: boolean; error?: string }> {
  return VendorActions.delete(id);
}

// ==================== Asset Categories ====================

export async function listAssetCategories(): Promise<Category[]> {
  return CategoryActions.list();
}

export async function createAssetCategory(data: {
  name: string;
  tech_specs?: number | null;
}): Promise<{ success: boolean; data?: Category; error?: string }> {
  return CategoryActions.create(data);
}

export async function updateAssetCategory(
  id: number,
  data: { name?: string; tech_specs?: number | null }
): Promise<{ success: boolean; data?: Category; error?: string }> {
  return CategoryActions.update(id, data);
}

export async function deleteAssetCategory(
  id: number
): Promise<{ success: boolean; error?: string }> {
  return CategoryActions.delete(id);
}

// ==================== Custom Lifecycles ====================

export async function listCustomLifecycles(): Promise<CustomLifecycle[]> {
  return LifecycleActions.list();
}

export async function createCustomLifecycle(data: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
  return LifecycleActions.create(data);
}

export async function updateCustomLifecycle(
  id: number,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
  return LifecycleActions.update(id, data);
}

export async function deleteCustomLifecycle(
  id: number
): Promise<{ success: boolean; error?: string }> {
  return LifecycleActions.delete(id);
}

