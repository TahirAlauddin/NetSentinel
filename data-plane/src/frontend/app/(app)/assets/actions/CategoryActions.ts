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
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<Category[] | { results: Category[] }>(
      "/assets/categories/"
    );

    if (response.error) {
      console.error("[CategoryActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    return extractedData;
  }

  /**
   * Create an asset category
   */
  static async create(data: {
    name: string;
    tech_specs?: number | null;
  }): Promise<{ success: boolean; data?: Category; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[CategoryActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.post<Category>("/assets/categories/", data);
    if (response.error) {
      console.error("[CategoryActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Update an asset category
   */
  static async update(
    id: number,
    data: { name?: string; tech_specs?: number | null }
  ): Promise<{ success: boolean; data?: Category; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[CategoryActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.patch<Category>(`/assets/categories/${id}/`, data);
    if (response.error) {
      console.error("[CategoryActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Delete an asset category
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[CategoryActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.delete(`/assets/categories/${id}/`);
    if (response.error) {
      console.error("[CategoryActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true };
  }
}
