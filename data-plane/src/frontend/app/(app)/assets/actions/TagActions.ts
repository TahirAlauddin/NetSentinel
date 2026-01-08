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
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<Tag[] | { results: Tag[] }>("/assets/tags/");

    if (response.error) {
      console.error("[TagActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    return extractedData;
  }

  /**
   * Create an asset tag
   */
  static async create(data: {
    name: string;
    color?: string;
  }): Promise<{ success: boolean; data?: Tag; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[TagActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.post<Tag>("/assets/tags/", data);
    if (response.error) {
      console.error("[TagActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Update an asset tag
   */
  static async update(
    id: number,
    data: { name?: string; color?: string }
  ): Promise<{ success: boolean; data?: Tag; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[TagActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.patch<Tag>(`/assets/tags/${id}/`, data);
    if (response.error) {
      console.error("[TagActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Delete an asset tag
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[TagActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.delete(`/assets/tags/${id}/`);
    if (response.error) {
      console.error("[TagActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true };
  }
}
