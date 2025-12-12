import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { Tag } from "@/types/assets/fields";
import { AssetActionUtils } from "./utils";

/**
 * Asset Tag operations
 */
export class TagActions {
  /**
   * List all asset tags
   */
  static async list(): Promise<Tag[]> {
    console.log("[TagActions.list] Starting");
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[TagActions.list] Session authenticated, user:", session?.user?.username);

    console.log("[TagActions.list] Making API request to /assets/tags/");
    const response = await serverApi.get<Tag[] | { results: Tag[] }>("/assets/tags/");
    console.log("[TagActions.list] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[TagActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    console.log("[TagActions.list] Success - returning", extractedData.length, "tags");
    return extractedData;
  }

  /**
   * Create an asset tag
   */
  static async create(data: {
    name: string;
    color?: string;
  }): Promise<{ success: boolean; data?: Tag; error?: string }> {
    console.log("[TagActions.create] Starting - data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[TagActions.create] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[TagActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[TagActions.create] Making API POST request to /assets/tags/");
    const response = await serverApi.post<Tag>("/assets/tags/", data);
    console.log("[TagActions.create] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[TagActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[TagActions.create] Success - tag created with id:", response.data?.id);
    return { success: true, data: response.data };
  }

  /**
   * Update an asset tag
   */
  static async update(
    id: number,
    data: { name?: string; color?: string }
  ): Promise<{ success: boolean; data?: Tag; error?: string }> {
    console.log("[TagActions.update] Starting - id:", id, "data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[TagActions.update] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[TagActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[TagActions.update] Making API PATCH request to /assets/tags/" + id + "/");
    const response = await serverApi.patch<Tag>(`/assets/tags/${id}/`, data);
    console.log("[TagActions.update] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[TagActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[TagActions.update] Success");
    return { success: true, data: response.data };
  }

  /**
   * Delete an asset tag
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    console.log("[TagActions.delete] Starting - id:", id);
    const session = await getServerSession(authOptions);
    console.log("[TagActions.delete] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[TagActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[TagActions.delete] Making API DELETE request to /assets/tags/" + id + "/");
    const response = await serverApi.delete(`/assets/tags/${id}/`);
    console.log("[TagActions.delete] API response - status:", response.status, "error:", response.error);
    if (response.error) {
      console.error("[TagActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[TagActions.delete] Success");
    return { success: true };
  }
}

