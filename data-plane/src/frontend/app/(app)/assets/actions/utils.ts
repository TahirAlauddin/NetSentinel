import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { Tag } from "@/types/assets/fields";

/**
 * Shared utility functions for asset actions
 */
export class AssetActionUtils {
  /**
   * Ensures user is authenticated
   * @throws Error if not authenticated
   */
  static ensureAuthenticated(session: { accessToken?: string } | null): void {
    if (!session?.accessToken) {
      throw new Error("Not authenticated");
    }
  }

  /**
   * Handles paginated or array API responses
   */
  static extractArrayData<T>(data: T[] | { results: T[] } | null | undefined): T[] {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "object" && "results" in data && Array.isArray((data as { results: T[] }).results)) {
      return (data as { results: T[] }).results;
    }

    console.warn("Unexpected data format:", data);
    return [];
  }

  /**
   * Builds query string from parameters
   */
  static buildQueryString(params?: {
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

  /**
   * Finds or creates an asset tag by name
   * @param tagName - The name of the tag to find or create
   * @returns The tag ID, or null if creation failed
   */
  static async findOrCreateAssetTag(tagName: string): Promise<number | null> {
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
        const tags = AssetActionUtils.extractArrayData(tagsResponse.data);
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
}

