import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { ServerApiRequestOptions } from "@/types/api-client";
import { Asset } from "@/types/assets/asset";
import { AssetCreateDto, AssetUpdateDto } from "@/types/assets/dto";
import { AssetRelation } from "@/types/assets/relations";
import { AssetStats } from "@/types/assets";
import { BasicDetailsStepFormData } from "@/types/assets/steps";
import { AssetActionUtils } from "./utils";
import { Tag } from "@/types/assets/fields";
import { validateImageFile, validateAttachmentFile } from "@/lib/security/file-validation";
import { assetCreateSchema, assetUpdateSchema, validateData } from "@/lib/security/validation-schemas";

function getActionErrorMessage(status?: number, errorStr?: string, defaultMessage = "Failed operation", customMessages?: Record<number, string>) {
  let errorMessage = errorStr || defaultMessage;
  if (customMessages && status && customMessages[status]) {
    errorMessage = customMessages[status];
  } else if (status === 400) {
    errorMessage = `Validation error: ${errorMessage}`;
  } else if (status === 401) {
    errorMessage = "Authentication failed. Please log in again.";
  } else if (status === 403) {
    errorMessage = "You don't have permission to perform this action.";
  } else if (status === 404) {
    errorMessage = "Asset not found.";
  } else if (status && status >= 500) {
    errorMessage = "Server error. Please try again later.";
  }
  return errorMessage;
}

async function addTagToAssetData(validatedData: AssetCreateDto | AssetUpdateDto, tagId: number | null, isUpdate = false, id?: number) {
  if (!tagId) return;
  if (isUpdate && validatedData.tags === undefined && id !== undefined) {
    try {
      const existingAsset = await AssetActions.get(id);
      const existingTags = existingAsset.tags;
      if (existingTags && Array.isArray(existingTags)) {
        validatedData.tags = existingTags
          .map((tag: Tag | number) => {
            if (typeof tag === "number") return tag;
            if (typeof tag === "object" && tag !== null && "id" in tag) return tag.id;
            return null;
          })
          .filter((id: number | null): id is number => id !== null);
      } else {
        validatedData.tags = [];
      }
    } catch (error) {
      console.warn("Could not fetch existing asset tags:", error);
      validatedData.tags = [];
    }
  }
  if (!validatedData.tags || !Array.isArray(validatedData.tags)) {
    validatedData.tags = [];
  }
  if (!validatedData.tags.includes(tagId)) {
    validatedData.tags.push(tagId);
  }
}

/**
 * Asset CRUD operations and related functionality
 */
export class AssetActions {
  /**
   * Get asset basic details
   */
  static async getBasicDetails(id: number): Promise<BasicDetailsStepFormData> {
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<BasicDetailsStepFormData>(`/assets/basic-details/${id}/`);

    if (response.error) {
      console.error("[AssetActions.getBasicDetails] Error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("[AssetActions.getBasicDetails] No data returned");
      throw new Error("Asset basic details not found");
    }

    return response.data as BasicDetailsStepFormData;
  }

  /**
   * List all assets
   */
  static async list(params?: {
    category?: number;
    status?: string;
    vendor?: number;
    location?: number;
    search?: string;
  }): Promise<Asset[]> {
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const queryString = AssetActionUtils.buildQueryString(params);
    const endpoint = `/assets/${queryString ? `?${queryString}` : ""}`;

    const response = await serverApi.get<
      Asset[] | { count?: number; next?: string | null; previous?: string | null; results: Asset[] }
    >(endpoint);

    if (response.error) {
      console.error("[AssetActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const initialData = response.data;
    if (!initialData) {
      return [];
    }

    // Non-paginated response: return as-is.
    if (Array.isArray(initialData)) {
      return initialData;
    }

    // Paginated response: fetch all pages so dashboards/lists reflect total records.
    // Use ID-based deduping because page boundaries can overlap when backend ordering is not fully stable.
    const dedupedById = new Map<number, Asset>();
    const seedItems = Array.isArray(initialData.results) ? initialData.results : [];
    for (const asset of seedItems) {
      if (asset?.id) dedupedById.set(asset.id, asset);
    }
    const totalCount =
      typeof initialData.count === "number" && Number.isFinite(initialData.count)
        ? initialData.count
        : dedupedById.size;

    let page = 2;
    while (dedupedById.size < totalCount) {
      const pageEndpoint = `/assets/?${queryString ? `${queryString}&` : ""}page=${page}`;
      const pageResponse = await serverApi.get<
        Asset[] | { count?: number; next?: string | null; previous?: string | null; results: Asset[] }
      >(pageEndpoint);

      if (pageResponse.error) {
        console.error("[AssetActions.list] Error loading page:", page, pageResponse.error);
        break;
      }

      const pageData = pageResponse.data;
      if (!pageData) {
        break;
      }

      const pageItems = Array.isArray(pageData)
        ? pageData
        : Array.isArray(pageData.results)
          ? pageData.results
          : [];

      if (pageItems.length === 0) {
        break;
      }

      for (const asset of pageItems) {
        if (asset?.id) dedupedById.set(asset.id, asset);
      }
      page += 1;
    }

    return Array.from(dedupedById.values());
  }

  /**
   * Get a single asset by ID
   */
  static async get(id: number): Promise<Asset> {
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<Asset>(`/assets/${id}/`);

    if (response.error) {
      console.error("[AssetActions.get] Error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("[AssetActions.get] No data returned");
      throw new Error("Asset not found");
    }

    return response.data;
  }

  /**
   * Create a new asset
   */
  static async create(
    data: AssetCreateDto
  ): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
    try {
      // Check authentication inside the action
      const session = await getServerSession(authOptions);
      if (!session?.accessToken) {
        console.error("[AssetActions.create] Not authenticated");
        return { success: false, error: "Not authenticated. Please log in again." };
      }

      // Validate inputs with Zod - never trust form data
      const validation = validateData(data, assetCreateSchema);
      if (!validation.success) {
        console.error("[AssetActions.create] Validation failed:", validation.error);
        return { success: false, error: `Validation error: ${validation.error}` };
      }

      // Use validated data (assert to DTO: schema validates required fields, passthrough keeps the rest)
      const validatedData = validation.data as AssetCreateDto;

      // If asset_tag is provided, create/find the tag and add it to tags array
      if (validatedData.asset_tag && typeof validatedData.asset_tag === "string" && validatedData.asset_tag.trim() !== "") {
        const tagId = await AssetActionUtils.findOrCreateAssetTag(validatedData.asset_tag);
        await addTagToAssetData(validatedData, tagId);
      }

      // Send request to backend with validated data
      const response = await serverApi.post<Asset>("/assets/", validatedData);

      if (response.error) {
        const errorMessage = getActionErrorMessage(response.status, response.error, "Failed to create asset", {
          403: "You don't have permission to create assets."
        });
        console.error("[AssetActions.create] Error response:", response.status, errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!response.data) {
        console.error("[AssetActions.create] No data returned after successful creation");
        return { success: false, error: "Asset was created but no data was returned" };
      }

      return {
        success: true,
        message: "Asset created successfully!",
        data: response.data,
      };
    } catch (error) {
      console.error("[AssetActions.create] Exception:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating the asset",
      };
    }
  }

  /**
   * Update an existing asset
   */
  static async update(
    id: number,
    data: AssetUpdateDto
  ): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
    try {
      // Check authentication inside the action
      const session = await getServerSession(authOptions);
      if (!session?.accessToken) {
        console.error("[AssetActions.update] Not authenticated");
        return { success: false, error: "Not authenticated. Please log in again." };
      }

      // Validate inputs with Zod - never trust form data
      const validation = validateData(data, assetUpdateSchema);
      if (!validation.success) {
        console.error("[AssetActions.update] Validation failed:", validation.error);
        return { success: false, error: `Validation error: ${validation.error}` };
      }

      // Use validated data (assert to DTO: schema validates required fields, passthrough keeps the rest)
      const validatedData = validation.data as AssetUpdateDto;

      // If asset_tag is provided, create/find the tag and add it to tags array
      if (validatedData.asset_tag && typeof validatedData.asset_tag === "string" && validatedData.asset_tag.trim() !== "") {
        const tagId = await AssetActionUtils.findOrCreateAssetTag(validatedData.asset_tag);
        await addTagToAssetData(validatedData, tagId, true, id);
      }

      // Send request to backend with validated data
      const response = await serverApi.patch<Asset>(`/assets/${id}/`, validatedData);

      if (response.error) {
        const errorMessage = getActionErrorMessage(response.status, response.error, "Failed to update asset", {
          403: "You don't have permission to update this asset."
        });
        console.error("[AssetActions.update] Error response:", response.status, errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!response.data) {
        console.error("[AssetActions.update] No data returned after successful update");
        return { success: false, error: "Asset was updated but no data was returned" };
      }

      return {
        success: true,
        message: "Asset updated successfully!",
        data: response.data,
      };
    } catch (error) {
      console.error("[AssetActions.update] Exception:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating the asset",
      };
    }
  }

  /**
   * Delete an asset
   */
  static async delete(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[AssetActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.delete(`/assets/${id}/`);

    if (response.error) {
      console.error("[AssetActions.delete] Error:", response.error);
      return { success: false, error: response.error || "Failed to delete asset" };
    }

    return { success: true, message: "Asset deleted successfully!" };
  }

  /**
   * Get asset statistics
   */
  static async getStats(): Promise<AssetStats> {
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<AssetStats>("/assets/stats/");

    if (response.error) {
      console.error("[AssetActions.getStats] Error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("[AssetActions.getStats] No data returned");
      throw new Error("Failed to get asset statistics");
    }

    return response.data;
  }

  /**
   * Upload asset images
   */
  static async uploadImages(
    assetId: number,
    images: (File | string | { image?: string })[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!images || images.length === 0) {
      return { success: true };
    }

    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[AssetActions.uploadImages] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    // Validate asset ID
    if (!Number.isInteger(assetId) || assetId <= 0) {
      return { success: false, error: "Invalid asset ID" };
    }

    // Only handle File uploads; skip existing URLs/objects for now
    const files = images.filter((img): img is File => img instanceof File);
    if (files.length === 0) {
      return { success: true };
    }

    // Validate files using file validation utility
    for (const file of files) {
      const validation = validateImageFile(file, 10); // 10MB max
      if (!validation.valid) {
        return { success: false, error: validation.error || `Invalid file: ${file.name}` };
      }
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("image", file));

    const response = await serverApi.post<FormData>(`/assets/${assetId}/images/`, formData, {
      isFormData: true,
    } as Omit<ServerApiRequestOptions, 'method' | 'body'> & { isFormData?: boolean });

    if (response.error) {
      console.error("[AssetActions.uploadImages] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true };
  }

  /**
   * Upload asset attachments
   */
  static async uploadAttachments(
    assetId: number,
    attachments: (File | string | { file?: string })[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!attachments || attachments.length === 0) {
      return { success: true };
    }

    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[AssetActions.uploadAttachments] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    // Validate asset ID
    if (!Number.isInteger(assetId) || assetId <= 0) {
      return { success: false, error: "Invalid asset ID" };
    }

    const files = attachments.filter((att): att is File => att instanceof File);
    if (files.length === 0) {
      return { success: true };
    }

    // Validate files using file validation utility
    for (const file of files) {
      const validation = validateAttachmentFile(file, 50); // 50MB max
      if (!validation.valid) {
        return { success: false, error: validation.error || `Invalid file: ${file.name}` };
      }
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    const response = await serverApi.post<FormData>(`/assets/${assetId}/attachments/`, formData, {
      isFormData: true,
    } as Omit<ServerApiRequestOptions, 'method' | 'body'> & { isFormData?: boolean });

    if (response.error) {
      console.error("[AssetActions.uploadAttachments] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true };
  }

  /**
   * Set asset relations (related items)
   */
  static async setRelations(
    assetId: number,
    relatedItems: number[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!relatedItems || relatedItems.length === 0) {
      return { success: true };
    }

    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[AssetActions.setRelations] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    // Create relations one by one; backend will enforce duplicates
    for (const relatedId of relatedItems) {
      if (!relatedId || !Number.isInteger(relatedId)) {
        continue;
      }

      const response = await serverApi.post<Partial<AssetRelation>>("/assets/relations/", {
        asset: assetId,
        related_asset: relatedId,
      });

      if (response.error) {
        console.error("[AssetActions.setRelations] Error creating relation:", response.error);
        return { success: false, error: response.error };
      }
    }

    return { success: true };
  }
}
