import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { Asset } from "@/types/assets/asset";
import { AssetCreateDto, AssetUpdateDto } from "@/types/assets/dto";
import { AssetRelation } from "@/types/assets/relations";
import { AssetStats } from "@/types/assets";
import { BasicDetailsStepFormData } from "@/types/assets/steps";
import { AssetActionUtils } from "./utils";

/**
 * Asset CRUD operations and related functionality
 */
export class AssetActions {
  /**
   * Get asset basic details
   */
  static async getBasicDetails(id: number): Promise<BasicDetailsStepFormData> {
    console.log("[AssetActions.getBasicDetails] Starting - id:", id);
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[AssetActions.getBasicDetails] Session authenticated, user:", session?.user?.username);

    console.log("[AssetActions.getBasicDetails] Making API request to /assets/basic-details/" + id + "/");
    const response = await serverApi.get<BasicDetailsStepFormData>(`/assets/basic-details/${id}/`);
    console.log("[AssetActions.getBasicDetails] API response - status:", response.status, "error:", response.error);

    if (response.error) {
      console.error("[AssetActions.getBasicDetails] Error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("[AssetActions.getBasicDetails] No data returned");
      throw new Error("Asset basic details not found");
    }

    console.log("[AssetActions.getBasicDetails] Success - returning data");
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
    console.log("[AssetActions.list] Starting - params:", JSON.stringify(params));
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[AssetActions.list] Session authenticated, user:", session?.user?.username);

    const queryString = AssetActionUtils.buildQueryString(params);
    const endpoint = `/assets/${queryString ? `?${queryString}` : ""}`;
    console.log("[AssetActions.list] Endpoint:", endpoint);

    console.log("[AssetActions.list] Making API request");
    const response = await serverApi.get<Asset[] | { results: Asset[] }>(endpoint);
    console.log("[AssetActions.list] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[AssetActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    console.log("[AssetActions.list] Success - returning", extractedData.length, "assets");
    return extractedData;
  }

  /**
   * Get a single asset by ID
   */
  static async get(id: number): Promise<Asset> {
    console.log("[AssetActions.get] Starting - id:", id);
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[AssetActions.get] Session authenticated, user:", session?.user?.username);

    console.log("[AssetActions.get] Making API request to /assets/" + id + "/");
    const response = await serverApi.get<Asset>(`/assets/${id}/`);
    console.log("[AssetActions.get] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[AssetActions.get] Error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("[AssetActions.get] No data returned");
      throw new Error("Asset not found");
    }

    console.log("[AssetActions.get] Success - returning asset:", response.data.id);
    return response.data;
  }

  /**
   * Create a new asset
   */
  static async create(
    data: AssetCreateDto
  ): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
    console.log("[AssetActions.create] Starting - data keys:", Object.keys(data));
    try {
      const session = await getServerSession(authOptions);
      console.log("[AssetActions.create] Session check - hasAccessToken:", !!session?.accessToken, "user:", session?.user?.username);
      if (!session?.accessToken) {
        console.error("[AssetActions.create] Not authenticated");
        return { success: false, error: "Not authenticated. Please log in again." };
      }

      // If asset_tag is provided, create/find the tag and add it to tags array
      if (
        data.asset_tag &&
        typeof data.asset_tag === "string" &&
        data.asset_tag.trim() !== ""
      ) {
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
      console.log("[AssetActions.create] Making API POST request to /assets/");
      const response = await serverApi.post<Asset>("/assets/", data);
      console.log("[AssetActions.create] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

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

      console.log("[AssetActions.create] Success - asset created with id:", response.data.id);
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
    console.log("[AssetActions.update] Starting - id:", id, "data keys:", Object.keys(data));
    try {
      const session = await getServerSession(authOptions);
      console.log("[AssetActions.update] Session check - hasAccessToken:", !!session?.accessToken, "user:", session?.user?.username);
      if (!session?.accessToken) {
        console.error("[AssetActions.update] Not authenticated");
        return { success: false, error: "Not authenticated. Please log in again." };
      }

      // If asset_tag is provided, create/find the tag and add it to tags array
      if (
        data.asset_tag &&
        typeof data.asset_tag === "string" &&
        data.asset_tag.trim() !== ""
      ) {
        const tagId = await AssetActionUtils.findOrCreateAssetTag(data.asset_tag);
        if (tagId) {
          // For updates, preserve existing tags if tags weren't explicitly provided in the update
          if (data.tags === undefined && data.tags === undefined) {
            // Fetch existing asset to get current tags
            try {
              const existingAsset = await AssetActions.get(id);
              // Handle tags - they might be objects or IDs
              const existingTags = (existingAsset as any).tags;
              if (existingTags && Array.isArray(existingTags)) {
                // Extract tag IDs from tag objects or use IDs directly
                data.tags = existingTags
                  .map((tag: any) => {
                    if (typeof tag === "number") return tag;
                    if (typeof tag === "object" && tag !== null && "id" in tag) {
                      return tag.id;
                    }
                    return null;
                  })
                  .filter((id: any): id is number => typeof id === "number");
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

      console.log("[AssetActions.update] Making API PATCH request to /assets/" + id + "/");
      const response = await serverApi.patch<Asset>(`/assets/${id}/`, data);
      console.log("[AssetActions.update] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

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

      console.log("[AssetActions.update] Success - asset updated");
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
    console.log("[AssetActions.delete] Starting - id:", id);
    const session = await getServerSession(authOptions);
    console.log("[AssetActions.delete] Session check - hasAccessToken:", !!session?.accessToken, "user:", session?.user?.username);
    if (!session?.accessToken) {
      console.error("[AssetActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[AssetActions.delete] Making API DELETE request to /assets/" + id + "/");
    const response = await serverApi.delete(`/assets/${id}/`);
    console.log("[AssetActions.delete] API response - status:", response.status, "error:", response.error);

    if (response.error) {
      console.error("[AssetActions.delete] Error:", response.error);
      return { success: false, error: response.error || "Failed to delete asset" };
    }

    console.log("[AssetActions.delete] Success - asset deleted");
    return { success: true, message: "Asset deleted successfully!" };
  }

  /**
   * Get asset statistics
   */
  static async getStats(): Promise<AssetStats> {
    console.log("[AssetActions.getStats] Starting");
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[AssetActions.getStats] Session authenticated, user:", session?.user?.username);

    console.log("[AssetActions.getStats] Making API request to /assets/stats/");
    const response = await serverApi.get<AssetStats>("/assets/stats/");
    console.log("[AssetActions.getStats] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[AssetActions.getStats] Error:", response.error);
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error("[AssetActions.getStats] No data returned");
      throw new Error("Failed to get asset statistics");
    }

    console.log("[AssetActions.getStats] Success - returning stats");
    return response.data;
  }

  /**
   * Upload asset images
   */
  static async uploadImages(
    assetId: number,
    images: (File | string | { image?: string })[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log("[AssetActions.uploadImages] Starting - assetId:", assetId, "images count:", images?.length);
    if (!images || images.length === 0) {
      console.log("[AssetActions.uploadImages] No images to upload, returning success");
      return { success: true };
    }

    const session = await getServerSession(authOptions);
    console.log("[AssetActions.uploadImages] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[AssetActions.uploadImages] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    // Only handle File uploads; skip existing URLs/objects for now
    const files = images.filter((img): img is File => img instanceof File);
    console.log("[AssetActions.uploadImages] Files to upload:", files.length);
    if (files.length === 0) {
      console.log("[AssetActions.uploadImages] No File objects to upload, returning success");
      return { success: true };
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("image", file));

    console.log("[AssetActions.uploadImages] Making API POST request to /assets/" + assetId + "/images/");
    const response = await serverApi.post<FormData>(`/assets/${assetId}/images/`, formData, {
      isFormData: true,
    } as any);
    console.log("[AssetActions.uploadImages] API response - status:", response.status, "error:", response.error);

    if (response.error) {
      console.error("[AssetActions.uploadImages] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[AssetActions.uploadImages] Success");
    return { success: true };
  }

  /**
   * Upload asset attachments
   */
  static async uploadAttachments(
    assetId: number,
    attachments: (File | string | { file?: string })[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log("[AssetActions.uploadAttachments] Starting - assetId:", assetId, "attachments count:", attachments?.length);
    if (!attachments || attachments.length === 0) {
      console.log("[AssetActions.uploadAttachments] No attachments to upload, returning success");
      return { success: true };
    }

    const session = await getServerSession(authOptions);
    console.log("[AssetActions.uploadAttachments] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[AssetActions.uploadAttachments] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const files = attachments.filter((att): att is File => att instanceof File);
    console.log("[AssetActions.uploadAttachments] Files to upload:", files.length);
    if (files.length === 0) {
      console.log("[AssetActions.uploadAttachments] No File objects to upload, returning success");
      return { success: true };
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    console.log("[AssetActions.uploadAttachments] Making API POST request to /assets/" + assetId + "/attachments/");
    const response = await serverApi.post<FormData>(
      `/assets/${assetId}/attachments/`,
      formData,
      {
        isFormData: true,
      } as any
    );
    console.log("[AssetActions.uploadAttachments] API response - status:", response.status, "error:", response.error);

    if (response.error) {
      console.error("[AssetActions.uploadAttachments] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[AssetActions.uploadAttachments] Success");
    return { success: true };
  }

  /**
   * Set asset relations (related items)
   */
  static async setRelations(
    assetId: number,
    relatedItems: (number | { id: number })[]
  ): Promise<{ success: boolean; error?: string }> {
    console.log("[AssetActions.setRelations] Starting - assetId:", assetId, "relatedItems count:", relatedItems?.length);
    if (!relatedItems || relatedItems.length === 0) {
      console.log("[AssetActions.setRelations] No relations to set, returning success");
      return { success: true };
    }

    const session = await getServerSession(authOptions);
    console.log("[AssetActions.setRelations] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[AssetActions.setRelations] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    // Create relations one by one; backend will enforce duplicates
    for (const item of relatedItems) {
      const relatedId = typeof item === "number" ? item : item?.id;
      if (!relatedId) {
        console.log("[AssetActions.setRelations] Skipping invalid item:", item);
        continue;
      }

      console.log("[AssetActions.setRelations] Creating relation - asset:", assetId, "related:", relatedId);
      const response = await serverApi.post<Partial<AssetRelation>>("/assets/relations/", {
        asset: assetId,
        related_asset: relatedId,
      });
      console.log("[AssetActions.setRelations] Relation response - status:", response.status, "error:", response.error);

      if (response.error) {
        console.error("[AssetActions.setRelations] Error creating relation:", response.error);
        return { success: false, error: response.error };
      }
    }

    console.log("[AssetActions.setRelations] Success - all relations created");
    return { success: true };
  }
}

