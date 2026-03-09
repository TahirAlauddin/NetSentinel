"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { DataCircuitRecord, DataCircuitCreateDto } from "@/types/data-circuits";
import type { LocationRecord } from "@/types/locations";
import type { ProviderRecord } from "@/types/providers";
import {
  listDataCircuits,
  createDataCircuit as apiCreate,
  deleteDataCircuit as apiDelete,
  updateDataCircuit as apiUpdate,
  listLocations,
  listProviders,
} from "@/lib/data-circuits-api";

export function useDataCircuits() {
  const { data: session } = useSession();
  const [dataCircuits, setDataCircuits] = useState<DataCircuitRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const refreshCircuits = useCallback(async () => {
    const list = await listDataCircuits();
    setDataCircuits(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    if (!session) return;

    async function load() {
      try {
        const [circuitList, locationList, providerList] = await Promise.all([
          listDataCircuits(),
          listLocations(),
          listProviders(),
        ]);
        setDataCircuits(Array.isArray(circuitList) ? circuitList : []);
        setLocations(Array.isArray(locationList) ? locationList : []);
        setProviders(Array.isArray(providerList) ? providerList : []);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("Authentication required")) {
            return;
          }
          if (!error.message.includes("401")) {
            toast.error("Failed to load data circuits");
          }
        }
        setDataCircuits([]);
        setLocations([]);
        setProviders([]);
      }
    }
    load();
  }, [session]);

  const createDataCircuit = useCallback(
    async (data: DataCircuitCreateDto) => {
      setSubmitting(true);
      try {
        const result = await apiCreate(data);
        if (result.success) {
          toast.success(result.message ?? "Data circuit created successfully!");
          await refreshCircuits();
          return true;
        }
        toast.error(result.error ?? "Failed to create data circuit");
        return false;
      } catch (error) {
        console.error("Failed to add data circuit:", error);
        toast.error("An unexpected error occurred. Please try again.");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshCircuits]
  );

  const deleteDataCircuit = useCallback(
    async (id: number) => {
      const result = await apiDelete(id);
      if (result.success) {
        toast.success(result.message ?? "Data circuit deleted successfully!");
        await refreshCircuits();
      } else {
        toast.error(result.error ?? "Failed to delete data circuit");
      }
    },
    [refreshCircuits]
  );

  const updateDataCircuit = useCallback(
    async (id: number, data: DataCircuitCreateDto) => {
      try {
        const result = await apiUpdate(id, data);
        if (result.success) {
          toast.success(result.message ?? "Data circuit updated successfully!");
          await refreshCircuits();
          return true;
        }
        toast.error(result.error ?? "Failed to update data circuit");
        return false;
      } catch (error) {
        console.error("Failed to update data circuit:", error);
        toast.error("An unexpected error occurred. Please try again.");
        return false;
      }
    },
    [refreshCircuits]
  );

  return {
    dataCircuits,
    setDataCircuits,
    locations,
    providers,
    submitting,
    refreshCircuits,
    createDataCircuit,
    deleteDataCircuit,
    updateDataCircuit,
  };
}
