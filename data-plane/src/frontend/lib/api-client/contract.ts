// ============================================================================
// Contract API Methods
// ============================================================================

import { BaseApiClient, BaseApiResponse } from "./index";
import { buildContractFormData } from "../contracts/utils";
import type {
  Contract,
  ContractListResponse,
  ContractCreatePayload,
  ContractUpdatePayload,
} from "@/types/contracts";

export class ContractApiClient extends BaseApiClient {
  private readonly endpoint = "/contracts/";

  /**
   * Get all contracts
   */
  async getContracts<T = ContractListResponse>(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`${this.endpoint}${queryString}`);
  }

  /**
   * Get a specific contract by ID
   */
  async getContract<T = Contract>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`${this.endpoint}${id}/`);
  }

  /**
   * Create a new contract. Sends FormData when payload includes document or logo file.
   */
  async createContract<T = Contract>(
    data: ContractCreatePayload
  ): Promise<BaseApiResponse<T>> {
    const hasFile =
      data.document instanceof File || data.logo instanceof File;
    if (hasFile) {
      const formData = buildContractFormData(data);
      return this.requestForm<T>(this.endpoint, formData, "POST");
    }
    const { document: _d, ...jsonPayload } = data;
    const body = {
      ...jsonPayload,
      nrc: data.nrc ?? 0,
      mrc: data.mrc ?? 0,
    };
    return this.post<T>(this.endpoint, body);
  }

  /**
   * Update a contract by ID. Sends FormData when payload includes document or logo file.
   */
  async updateContract<T = Contract>(
    id: number | string,
    data: ContractUpdatePayload
  ): Promise<BaseApiResponse<T>> {
    const hasFile =
      data.document instanceof File || data.logo instanceof File;
    if (hasFile) {
      const formData = buildContractFormData(data);
      return this.requestForm<T>(`${this.endpoint}${id}/`, formData, "PATCH");
    }
    const { document: _d, ...jsonPayload } = data;
    return this.patch<T>(`${this.endpoint}${id}/`, jsonPayload);
  }

  /**
   * Delete a contract by ID
   */
  async deleteContract<T = unknown>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`${this.endpoint}${id}/`);
  }

  /**
   * Fetch contract document as blob (authenticated). Use for view or download.
   */
  async getContractDocument(
    id: number | string
  ): Promise<BaseApiResponse<Blob> & { filename?: string }> {
    const session = await this.getSession();
    if (!session?.accessToken) {
      return { error: "No access token available", status: 401 };
    }
    const url = this.buildUrl(`${this.endpoint}${id}/document/`);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const data = JSON.parse(text);
          errorMessage = data.detail ?? data.message ?? errorMessage;
        } catch {
          // use default
        }
        return { error: errorMessage, status: response.status };
      }
      const data = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      let filename: string | undefined;
      if (disposition) {
        const match = /filename[^;=\n]*=(?:"([^"]*)"|([^;\n]*))/.exec(disposition);
        if (match) filename = (match[1] ?? match[2] ?? "").trim() || undefined;
      }
      return { data, status: response.status, filename };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  /**
   * Fetch contract logo as blob (authenticated). Use for img src or download.
   */
  async getContractLogo(
    id: number | string
  ): Promise<BaseApiResponse<Blob> & { url?: string }> {
    const session = await this.getSession();
    if (!session?.accessToken) {
      return { error: "No access token available", status: 401 };
    }
    const url = this.buildUrl(`${this.endpoint}${id}/logo/`);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const data = JSON.parse(text);
          errorMessage = data.detail ?? data.message ?? errorMessage;
        } catch {
          // use default
        }
        return { error: errorMessage, status: response.status };
      }
      const data = await response.blob();
      const objectUrl = URL.createObjectURL(data);
      return { data, status: response.status, url: objectUrl };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }
}
