import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";
import { Vendor } from "@/types/assets/fields";
import { AssetActionUtils } from "./utils";

/**
 * Vendor operations
 */
export class VendorActions {
  /**
   * List all vendors
   */
  static async list(): Promise<Vendor[]> {
    console.log("[VendorActions.list] Starting");
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);
    console.log("[VendorActions.list] Session authenticated, user:", session?.user?.username);

    console.log("[VendorActions.list] Making API request to /assets/vendors/");
    const response = await serverApi.get<Vendor[] | { results: Vendor[] }>("/assets/vendors/");
    console.log("[VendorActions.list] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);

    if (response.error) {
      console.error("[VendorActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
    console.log("[VendorActions.list] Success - returning", extractedData.length, "vendors");
    return extractedData;
  }

  /**
   * Create a vendor
   */
  static async create(data: {
    name: string;
    contact_info?: string;
    website?: string;
  }): Promise<{ success: boolean; data?: Vendor; error?: string }> {
    console.log("[VendorActions.create] Starting - data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[VendorActions.create] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[VendorActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[VendorActions.create] Making API POST request to /assets/vendors/");
    const response = await serverApi.post<Vendor>("/assets/vendors/", data);
    console.log("[VendorActions.create] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[VendorActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[VendorActions.create] Success - vendor created with id:", response.data?.id);
    return { success: true, data: response.data };
  }

  /**
   * Update a vendor
   */
  static async update(
    id: number,
    data: { name?: string; contact_info?: string; website?: string }
  ): Promise<{ success: boolean; data?: Vendor; error?: string }> {
    console.log("[VendorActions.update] Starting - id:", id, "data:", JSON.stringify(data));
    const session = await getServerSession(authOptions);
    console.log("[VendorActions.update] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[VendorActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[VendorActions.update] Making API PATCH request to /assets/vendors/" + id + "/");
    const response = await serverApi.patch<Vendor>(`/assets/vendors/${id}/`, data);
    console.log("[VendorActions.update] API response - status:", response.status, "error:", response.error, "hasData:", !!response.data);
    if (response.error) {
      console.error("[VendorActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[VendorActions.update] Success");
    return { success: true, data: response.data };
  }

  /**
   * Delete a vendor
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    console.log("[VendorActions.delete] Starting - id:", id);
    const session = await getServerSession(authOptions);
    console.log("[VendorActions.delete] Session check - hasAccessToken:", !!session?.accessToken);
    if (!session?.accessToken) {
      console.error("[VendorActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[VendorActions.delete] Making API DELETE request to /assets/vendors/" + id + "/");
    const response = await serverApi.delete(`/assets/vendors/${id}/`);
    console.log("[VendorActions.delete] API response - status:", response.status, "error:", response.error);
    if (response.error) {
      console.error("[VendorActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    console.log("[VendorActions.delete] Success");
    return { success: true };
  }
}

