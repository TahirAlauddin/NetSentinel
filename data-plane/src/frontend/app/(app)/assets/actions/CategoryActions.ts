import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { Category } from "@/types/assets/fields";
import { AssetActionUtils } from "./utils";

/**
 * Asset Category operations
 */
export class CategoryActions {
  /**
   * List all asset categories
   */
  static async list(): Promise<Category[]> {
    console.log("[CategoryActions.list] Starting");
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[CategoryActions.list] Session authenticated, user:", session?.user?.username);

    console.log("[CategoryActions.list] Making API request to /assets/categories/");
    const response = await serverApi.get<Category[] | { results: Category[] }>(
      "/assets/categories/"
    );
    console.log("[CategoryActions.list] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[CategoryActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    console.log("[CategoryActions.list] Success - returning", extractedData.length, "categories");
    return extractedData;
  }

  /**
   * Create an asset category
   */
  static async create(data: {
    name: string;
    tech_specs?: number | null;
  }): Promise<{ success: boolean; data?: Category; error?: string }> {
    console.log("[CategoryActions.create] Starting - data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[CategoryActions.create] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[CategoryActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[CategoryActions.create] Making API POST request to /assets/categories/");
    const response = await serverApi.post<Category>("/assets/categories/", data);
    console.log("[CategoryActions.create] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[CategoryActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[CategoryActions.create] Success - category created with id:", response.data?.id);
    return { success: true, data: response.data };
  }

  /**
   * Update an asset category
   */
  static async update(
    id: number,
    data: { name?: string; tech_specs?: number | null }
  ): Promise<{ success: boolean; data?: Category; error?: string }> {
    console.log("[CategoryActions.update] Starting - id:", id, "data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[CategoryActions.update] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[CategoryActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[CategoryActions.update] Making API PATCH request to /assets/categories/" + id + "/");
    const response = await serverApi.patch<Category>(`/assets/categories/${id}/`, data);
    console.log("[CategoryActions.update] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[CategoryActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[CategoryActions.update] Success");
    return { success: true, data: response.data };
  }

  /**
   * Delete an asset category
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    console.log("[CategoryActions.delete] Starting - id:", id);
    const session = await getServerSession(authOptions);
    console.log("[CategoryActions.delete] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[CategoryActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[CategoryActions.delete] Making API DELETE request to /assets/categories/" + id + "/");
    const response = await serverApi.delete(`/assets/categories/${id}/`);
    console.log("[CategoryActions.delete] API response - status:", response.status, "error:", response.error);
    if (response.error) {
      console.error("[CategoryActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[CategoryActions.delete] Success");
    return { success: true };
  }
}

