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

    const response = await serverApi.get<Asset[] | { results: Asset[] }>(endpoint);

    if (response.error) {
      console.error("[AssetActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    return extractedData;
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
      const session = await getServerSession(authOptions);
      if (!session?.accessToken) {
        console.error("[AssetActions.create] Not authenticated");
        return { success: false, error: "Not authenticated. Please log in again." };
      }

      // If asset_tag is provided, create/find the tag and add it to tags array
      if (data.asset_tag && typeof data.asset_tag === "string" && data.asset_tag.trim() !== "") {
        const tagId = await AssetActionUtils.findOrCreateAssetTag(data.asset_tag);
        if (tagId) {
          // Add the tag to the tags array if it doesn't already exist
          if (!data.tags) {
            data.tags = [];
          }
          if (!Array.isArray(data.tags)) {
            data.tags = [];
          }
          if (!data.tags.includes(tagId)) {
            data.tags.push(tagId);
          }
        }
      }

      // Send request to backend
      const response = await serverApi.post<Asset>("/assets/", data);

      if (response.error) {
        let errorMessage = response.error || "Failed to create asset";

        if (response.status === 400) {
          errorMessage = `Validation error: ${errorMessage}`;
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to create assets.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

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
      const session = await getServerSession(authOptions);
      if (!session?.accessToken) {
        console.error("[AssetActions.update] Not authenticated");
        return { success: false, error: "Not authenticated. Please log in again." };
      }

      // If asset_tag is provided, create/find the tag and add it to tags array
      if (data.asset_tag && typeof data.asset_tag === "string" && data.asset_tag.trim() !== "") {
        const tagId = await AssetActionUtils.findOrCreateAssetTag(data.asset_tag);
        if (tagId) {
          // For updates, preserve existing tags if tags weren't explicitly provided in the update
          if (data.tags === undefined && data.tags === undefined) {
            // Fetch existing asset to get current tags
            try {
              const existingAsset = await AssetActions.get(id);
              // Handle tags - they might be objects or IDs
              const existingTags = (existingAsset as Asset).tags;
              if (existingTags && Array.isArray(existingTags)) {
                // Extract tag IDs from tag objects or use IDs directly
                data.tags = existingTags
                  .map((tag: Tag | number) => {
                    if (typeof tag === "number") return tag;
                    if (typeof tag === "object" && tag !== null && "id" in tag) {
                      return tag.id;
                    }
                    return null;
                  })
                  .filter((id: number | null): id is number => id !== null);
              } else {
                data.tags = [];
              }
            } catch (error) {
              // If we can't fetch existing asset, start with empty array
              console.warn("Could not fetch existing asset tags:", error);
              data.tags = [];
            }
          }

          // Ensure tags is an array
          if (!data.tags) {
            data.tags = [];
          }
          if (!Array.isArray(data.tags)) {
            data.tags = [];
          }

          // Add the tag if it doesn't already exist
          if (!data.tags.includes(tagId)) {
            data.tags.push(tagId);
          }
        }
      }

      const response = await serverApi.patch<Asset>(`/assets/${id}/`, data);

      if (response.error) {
        let errorMessage = response.error || "Failed to update asset";

        if (response.status === 400) {
          errorMessage = `Validation error: ${errorMessage}`;
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to update this asset.";
        } else if (response.status === 404) {
          errorMessage = "Asset not found.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

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

    // Only handle File uploads; skip existing URLs/objects for now
    const files = images.filter((img): img is File => img instanceof File);
    if (files.length === 0) {
      return { success: true };
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

    const files = attachments.filter((att): att is File => att instanceof File);
    if (files.length === 0) {
      return { success: true };
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
    relatedItems: (number | { id: number })[]
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
    for (const item of relatedItems) {
      const relatedId = typeof item === "number" ? item : item?.id;
      if (!relatedId) {
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
