"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { AssetStats } from "@/types/assets";
import { BasicDetailsStepFormData } from "@/types/assets/steps";
import { Category, CustomLifecycle, Vendor, Tag } from "@/types/assets/fields";
import { Asset } from "@/types/assets/asset";
import { AssetCreateDto, AssetUpdateDto } from "@/types/assets/dto";

// ==================== Helper Functions ====================

/**
 * Ensures user is authenticated
 * @throws Error if not authenticated
 */
function ensureAuthenticated(session: any): void {
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }
}

/**
 * Finds or creates an asset tag by name
 * @param tagName - The name of the tag to find or create
 * @returns The tag ID, or null if creation failed
 */
async function findOrCreateAssetTag(tagName: string): Promise<number | null> {
  if (!tagName || tagName.trim() === "") {
    return null;
  }

  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    console.error("Not authenticated when trying to create asset tag");
    return null;
  }

  try {
    // First, try to find existing tag
    const tagsResponse = await serverApi.get<Tag[] | { results: Tag[] }>("/assets/tags/");

    if (tagsResponse.data) {
      const tags = extractArrayData(tagsResponse.data);
      const existingTag = tags.find(
        (tag) => tag.name.toLowerCase().trim() === tagName.toLowerCase().trim()
      );

      if (existingTag) {
        return existingTag.id;
      }
    }

    // Tag doesn't exist, create it
    const createResponse = await serverApi.post<Tag>("/assets/tags/", {
      name: tagName.trim(),
    });

    if (createResponse.error) {
      console.error("Failed to create asset tag:", createResponse.error);
      return null;
    }

    return createResponse.data?.id || null;
  } catch (error) {
    console.error("Error finding or creating asset tag:", error);
    return null;
  }
}


/**
 * Handles paginated or array API responses
 */
function extractArrayData<T>(data: T[] | { results: T[] } | null | undefined): T[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === "object" && "results" in data && Array.isArray((data as any).results)) {
    return (data as any).results;
  }

  console.warn("Unexpected data format:", data);
  return [];
}

/**
 * Builds query string from parameters
 */
function buildQueryString(params?: {
  category?: number;
  status?: string;
  vendor?: number;
  location?: number;
  search?: string;
}): string {
  const queryParams = new URLSearchParams();

  if (params?.category) queryParams.append("category", params.category.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.vendor) queryParams.append("vendor", params.vendor.toString());
  if (params?.location) queryParams.append("location", params.location.toString());
  if (params?.search) queryParams.append("search", params.search);

  return queryParams.toString();
}

// ==================== Assets ====================

export async function getAssetBasicDetails(id: number): Promise<BasicDetailsStepFormData> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<BasicDetailsStepFormData>(`/assets/basic-details/${id}/`);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Asset basic details not found");
  }

  return response.data as BasicDetailsStepFormData;
}

/**
 * Server action to list all assets
 * @param params - Optional query parameters for filtering
 * @returns Array of asset records
 * @throws Error if not authorized or API request fails
 */
export async function listAssets(params?: {
  category?: number;
  status?: string;
  vendor?: number;
  location?: number;
  search?: string;
}): Promise<Asset[]> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const queryString = buildQueryString(params);
  const endpoint = `/assets/${queryString ? `?${queryString}` : ""}`;

  const response = await serverApi.get<Asset[] | { results: Asset[] }>(endpoint);

  if (response.error) {
    throw new Error(response.error);
  }

  return extractArrayData(response.data);
}

/**
 * Server action to get a single asset by ID
 * @param id - Asset ID
 * @returns Asset record
 * @throws Error if not authorized or asset not found
 */
export async function getAsset(id: number): Promise<Asset> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<Asset>(`/assets/${id}/`);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Asset not found");
  }

  return response.data;
}

/**
 * Server action to create a new asset
 * @param data - Asset form data
 * @returns Success status and message or error
 */
export async function createAsset(
  data: AssetCreateDto
): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return { success: false, error: "Not authenticated. Please log in again." };
    }

    // If asset_tag is provided, create/find the tag and add it to tags array
    if (
      data.asset_tag &&
      typeof data.asset_tag === "string" &&
      data.asset_tag.trim() !== ""
    ) {
      const tagId = await findOrCreateAssetTag(data.asset_tag);
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
      // Extract detailed error message from response
      let errorMessage = response.error || "Failed to create asset";

      // If we have a status code, provide more context
      if (response.status === 400) {
        errorMessage = `Validation error: ${errorMessage}`;
      } else if (response.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to create assets.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }

      return { success: false, error: errorMessage };
    }

    if (!response.data) {
      return { success: false, error: "Asset was created but no data was returned" };
    }

    return {
      success: true,
      message: "Asset created successfully!",
      data: response.data,
    };
  } catch (error) {
    console.error("Error creating asset:", error);
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
 * Server action to update an existing asset
 * @param id - Asset ID
 * @param data - Asset form data
 * @returns Success status and message or error
 */
export async function updateAsset(
  id: number,
  data: AssetUpdateDto
): Promise<{ success: boolean; message?: string; error?: string; data?: Asset }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return { success: false, error: "Not authenticated. Please log in again." };
    }


    // If asset_tag is provided, create/find the tag and add it to tags array
    if (
      data.asset_tag &&
      typeof data.asset_tag === "string" &&
      data.asset_tag.trim() !== ""
    ) {
      const tagId = await findOrCreateAssetTag(data.asset_tag);
      if (tagId) {
        // For updates, preserve existing tags if tags weren't explicitly provided in the update
        if (data.tags === undefined && data.tags === undefined) {
          // Fetch existing asset to get current tags
          try {
            const existingAsset = await getAsset(id);
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

    const response = await serverApi.patch<Asset>(`/assets/${id}/`, data);

    if (response.error) {
      // Extract detailed error message from response
      let errorMessage = response.error || "Failed to update asset";

      // If we have a status code, provide more context
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

      return { success: false, error: errorMessage };
    }

    if (!response.data) {
      return { success: false, error: "Asset was updated but no data was returned" };
    }

    return {
      success: true,
      message: "Asset updated successfully!",
      data: response.data,
    };
  } catch (error) {
    console.error("Error updating asset:", error);
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
 * Server action to delete an asset
 * @param id - Asset ID
 * @returns Success status and message or error
 */
export async function deleteAsset(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.delete(`/assets/${id}/`);

  if (response.error) {
    return { success: false, error: response.error || "Failed to delete asset" };
  }

  return { success: true, message: "Asset deleted successfully!" };
}

/**
 * Server action to get asset statistics
 * @returns Asset statistics
 */
export async function getAssetStats(): Promise<AssetStats> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<AssetStats>("/assets/stats/");

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Failed to get asset statistics");
  }

  return response.data;
}

// ==================== Asset Tags ====================

/**
 * List all asset tags
 */
export async function listAssetTags(): Promise<Tag[]> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<Tag[] | { results: Tag[] }>("/assets/tags/");

  if (response.error) {
    throw new Error(response.error);
  }

  return extractArrayData(response.data);
}

/**
 * Create an asset tag
 */
export async function createAssetTag(data: {
  name: string;
  color?: string;
}): Promise<{ success: boolean; data?: Tag; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.post<Tag>("/assets/tags/", data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Update an asset tag
 */
export async function updateAssetTag(
  id: number,
  data: { name?: string; color?: string }
): Promise<{ success: boolean; data?: Tag; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.patch<Tag>(`/assets/tags/${id}/`, data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Delete an asset tag
 */
export async function deleteAssetTag(id: number): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.delete(`/assets/tags/${id}/`);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true };
}

// ==================== Vendors ====================

/**
 * List all vendors
 */
export async function listVendors(): Promise<Vendor[]> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<Vendor[] | { results: Vendor[] }>("/assets/vendors/");

  if (response.error) {
    throw new Error(response.error);
  }

  return extractArrayData(response.data);
}

/**
 * Create a vendor
 */
export async function createVendor(data: {
  name: string;
  contact_info?: string;
  website?: string;
}): Promise<{ success: boolean; data?: Vendor; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.post<Vendor>("/assets/vendors/", data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Update a vendor
 */
export async function updateVendor(
  id: number,
  data: { name?: string; contact_info?: string; website?: string }
): Promise<{ success: boolean; data?: Vendor; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.patch<Vendor>(`/assets/vendors/${id}/`, data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Delete a vendor
 */
export async function deleteVendor(id: number): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.delete(`/assets/vendors/${id}/`);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true };
}

// ==================== Asset Categories ====================

/**
 * List all asset categories
 */
export async function listAssetCategories(): Promise<Category[]> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<Category[] | { results: Category[] }>("/assets/categories/");

  if (response.error) {
    throw new Error(response.error);
  }

  return extractArrayData(response.data);
}

/**
 * Create an asset category
 */
export async function createAssetCategory(data: {
  name: string;
  tech_specs?: number | null;
}): Promise<{ success: boolean; data?: Category; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.post<Category>("/assets/categories/", data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Update an asset category
 */
export async function updateAssetCategory(
  id: number,
  data: { name?: string; tech_specs?: number | null }
): Promise<{ success: boolean; data?: Category; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.patch<Category>(`/assets/categories/${id}/`, data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Delete an asset category
 */
export async function deleteAssetCategory(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.delete(`/assets/categories/${id}/`);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true };
}

// ==================== Custom Lifecycles ====================

/**
 * List all custom lifecycles
 */
export async function listCustomLifecycles(): Promise<CustomLifecycle[]> {
  const session = await getServerSession(authOptions);
  ensureAuthenticated(session);

  const response = await serverApi.get<CustomLifecycle[] | { results: CustomLifecycle[] }>(
    "/assets/lifecycles/"
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return extractArrayData(response.data);
}

/**
 * Create a custom lifecycle
 */
export async function createCustomLifecycle(data: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.post<CustomLifecycle>("/assets/lifecycles/", data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Update a custom lifecycle
 */
export async function updateCustomLifecycle(
  id: number,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.patch<CustomLifecycle>(`/assets/lifecycles/${id}/`, data);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
}

/**
 * Delete a custom lifecycle
 */
export async function deleteCustomLifecycle(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const response = await serverApi.delete(`/assets/lifecycles/${id}/`);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true };
}

// ==================== Tech Specs ====================

/**
 * List all tech specs
//  */
// export async function listTechSpecs(): Promise<TechSpecs[]> {
//   const session = await getServerSession(authOptions)
//   ensureAuthenticated(session)

//   const response = await serverApi.get<TechSpecs[] | { results: TechSpecs[] }>(
//     "/assets/tech-specs/"
//   )

//   if (response.error) {
//     throw new Error(response.error)
//   }

//   return extractArrayData(response.data)
// }

// /**
//  * Create a tech spec
//  */
// export async function createTechSpec(
//   data: { name: string }
// ): Promise<{ success: boolean; data?: TechSpecs; error?: string }> {
//   const session = await getServerSession(authOptions)
//   if (!session?.accessToken) {
//     return { success: false, error: "Not authenticated" }
//   }

//   const response = await serverApi.post<TechSpecs>("/assets/tech-specs/", data)
//   if (response.error) {
//     return { success: false, error: response.error }
//   }
//   return { success: true, data: response.data }
// }

// /**
//  * Update a tech spec
//  */
// export async function updateTechSpec(
//   id: number,
//   data: { name: string }
// ): Promise<{ success: boolean; data?: TechSpecs; error?: string }> {
//   const session = await getServerSession(authOptions)
//   if (!session?.accessToken) {
//     return { success: false, error: "Not authenticated" }
//   }

//   const response = await serverApi.patch<TechSpecs>(`/assets/tech-specs/${id}/`, data)
//   if (response.error) {
//     return { success: false, error: response.error }
//   }
//   return { success: true, data: response.data }
// }

// /**
//  * Delete a tech spec
//  */
// export async function deleteTechSpec(id: number): Promise<{ success: boolean; error?: string }> {
//   const session = await getServerSession(authOptions)
//   if (!session?.accessToken) {
//     return { success: false, error: "Not authenticated" }
//   }

//   const response = await serverApi.delete(`/assets/tech-specs/${id}/`)
//   if (response.error) {
//     return { success: false, error: response.error }
//   }
//   return { success: true }
// }
