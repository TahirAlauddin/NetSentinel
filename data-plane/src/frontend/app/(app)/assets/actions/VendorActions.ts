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
    const session = await getServerSession(authOptions);
    AssetActionUtils.ensureAuthenticated(session);

    const response = await serverApi.get<Vendor[] | { results: Vendor[] }>("/assets/vendors/");

    if (response.error) {
      console.error("[VendorActions.list] Error:", response.error);
      throw new Error(response.error);
    }

    const extractedData = AssetActionUtils.extractArrayData(response.data);
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
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[VendorActions.create] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.post<Vendor>("/assets/vendors/", data);
    if (response.error) {
      console.error("[VendorActions.create] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Update a vendor
   */
  static async update(
    id: number,
    data: { name?: string; contact_info?: string; website?: string }
  ): Promise<{ success: boolean; data?: Vendor; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[VendorActions.update] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.patch<Vendor>(`/assets/vendors/${id}/`, data);
    if (response.error) {
      console.error("[VendorActions.update] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true, data: response.data };
  }

  /**
   * Delete a vendor
   */
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.error("[VendorActions.delete] Not authenticated");
      return { success: false, error: "Not authenticated" };
    }

    const response = await serverApi.delete(`/assets/vendors/${id}/`);
    if (response.error) {
      console.error("[VendorActions.delete] Error:", response.error);
      return { success: false, error: response.error };
    }
    return { success: true };
  }
}

