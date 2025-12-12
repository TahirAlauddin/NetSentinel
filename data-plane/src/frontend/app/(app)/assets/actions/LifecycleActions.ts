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
    console.log("[LifecycleActions.list] Starting");
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[LifecycleActions.list] Session authenticated, user:", session?.user?.username);

    console.log("[LifecycleActions.list] Making API request to /assets/lifecycles/");
    const response = await serverApi.get<CustomLifecycle[] | { results: CustomLifecycle[] }>(
      "/assets/lifecycles/"
    );
    console.log("[LifecycleActions.list] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[LifecycleActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    console.log("[LifecycleActions.list] Success - returning", extractedData.length, "lifecycles");
    return extractedData;
  }

  /**
   * Create a custom lifecycle
   */
  static async create(data: {
    name: string;
    description?: string;
  }): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
    console.log("[LifecycleActions.create] Starting - data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[LifecycleActions.create] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[LifecycleActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[LifecycleActions.create] Making API POST request to /assets/lifecycles/");
    const response = await serverApi.post<CustomLifecycle>("/assets/lifecycles/", data);
    console.log("[LifecycleActions.create] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[LifecycleActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[LifecycleActions.create] Success - lifecycle created with id:", response.data?.id);
    return { success: true, data: response.data };
  }

  /**
   * Update a custom lifecycle
   */
  static async update(
    id: number,
    data: { name?: string; description?: string }
  ): Promise<{ success: boolean; data?: CustomLifecycle; error?: string }> {
    console.log("[LifecycleActions.update] Starting - id:", id, "data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[LifecycleActions.update] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[LifecycleActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[LifecycleActions.update] Making API PATCH request to /assets/lifecycles/" + id + "/");
    const response = await serverApi.patch<CustomLifecycle>(`/assets/lifecycles/${id}/`, data);
    console.log("[LifecycleActions.update] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[LifecycleActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[LifecycleActions.update] Success");
    return { success: true, data: response.data };
  }

  /**
   * Delete a custom lifecycle
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    console.log("[LifecycleActions.delete] Starting - id:", id);
    const session = await getServerSession(authOptions);
    console.log("[LifecycleActions.delete] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[LifecycleActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[LifecycleActions.delete] Making API DELETE request to /assets/lifecycles/" + id + "/");
    const response = await serverApi.delete(`/assets/lifecycles/${id}/`);
    console.log("[LifecycleActions.delete] API response - status:", response.status, "error:", response.error);
    if (response.error) {
      console.error("[LifecycleActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[LifecycleActions.delete] Success");
    return { success: true };
  }
}

