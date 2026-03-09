/**
 * Data circuits API helpers.
 * Normalize list/create/update/delete responses for use in the data-circuits page and useDataCircuits hook.
 */

import { TelecomApiClient } from "@/lib/api-client/telecom";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import type { DataCircuitRecord, DataCircuitCreateDto } from "@/types/data-circuits";
import type { LocationRecord } from "@/types/locations";
import type { ProviderRecord } from "@/types/providers";

function normalizeListResponse<T>(
  data: T[] | { results: T[] } | null | undefined
): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && "results" in data && Array.isArray((data as { results: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function ensureAuth<T>(response: { status?: number; error?: string; data?: T }): T {
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  if (response.error || response.data === undefined) {
    throw new Error(response.error ?? "Request failed");
  }
  return response.data;
}

export async function listDataCircuits(): Promise<DataCircuitRecord[]> {
  const api = new TelecomApiClient();
  const response = await api.getDataCircuits<DataCircuitRecord[] | { results: DataCircuitRecord[] }>();
  const data = ensureAuth(response);
  const list = normalizeListResponse(data);
  if (list.length === 0 && data != null && !Array.isArray(data) && !("results" in data)) {
    console.warn("Unexpected data circuits data format:", data);
  }
  return list;
}

export async function createDataCircuit(
  data: DataCircuitCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const response = await api.createDataCircuit(data);
  if (response.error || !response.data) {
    return { success: false, error: response.error ?? "Failed to create data circuit" };
  }
  return { success: true, message: "Data circuit created successfully" };
}

export async function deleteDataCircuit(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const response = await api.deleteDataCircuit(id);
  if (response.error) {
    return { success: false, error: response.error };
  }
  return { success: true, message: "Data circuit deleted successfully" };
}

export async function updateDataCircuit(
  id: number,
  data: DataCircuitCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const response = await api.updateDataCircuit(id, data);
  if (response.error || !response.data) {
    return { success: false, error: response.error ?? "Failed to update data circuit" };
  }
  return { success: true, message: "Data circuit updated successfully" };
}

export async function listLocations(): Promise<LocationRecord[]> {
  const api = new InfrastructureApiClient();
  const response = await api.getLocations<LocationRecord[] | { results: LocationRecord[] }>();
  const data = ensureAuth(response);
  const list = normalizeListResponse(data);
  if (list.length === 0 && data != null && !Array.isArray(data) && !("results" in data)) {
    console.warn("Unexpected locations data format:", data);
  }
  return list;
}

export async function listProviders(): Promise<ProviderRecord[]> {
  const api = new TelecomApiClient();
  const response = await api.getProviders<ProviderRecord[] | { results: ProviderRecord[] }>();
  const data = ensureAuth(response);
  return normalizeListResponse(data);
}
