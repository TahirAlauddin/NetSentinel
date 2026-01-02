import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { CustomLifecycle } from "@/types/assets/fields";
import { AssetActionUtils } from "./utils";

/**
 * Custom Lifecycle operations
 */
export class LifecycleActions {
  /**
   * List all custom lifecycles
   */
  static async list(): Promise<CustomLifecycle[]> {
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<CustomLifecycle[] | { results: CustomLifecycle[] }>(
      "/assets/lifecycles/"
    );

    if (response.error) {
      console.error("[LifecycleActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    return extractedData;
  }

  /**
   * Create a custom lifecycle
   */
  static async create(data: {
    name: string;
    description?: string;
  }): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[LifecycleActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.post<CustomLifecycle>("/assets/lifecycles/", data);
    if (response.error) {
      console.error("[LifecycleActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Update a custom lifecycle
   */
  static async update(
    id: number,
    data: { name?: string; description?: string }
  ): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[LifecycleActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.patch<CustomLifecycle>(`/assets/lifecycles/${id}/`, data);
    if (response.error) {
      console.error("[LifecycleActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Delete a custom lifecycle
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[LifecycleActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.delete(`/assets/lifecycles/${id}/`);
    if (response.error) {
      console.error("[LifecycleActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true };
  }
}
