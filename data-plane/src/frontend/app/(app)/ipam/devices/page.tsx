"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { DeviceTable } from "@/components/apps/ipam/device-table";
import { Device, DeviceType, Rack } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { usePermissions } from "@/contexts/permissions-context";

const ipamApi = new IpamApiClient();

export default function DevicesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    deviceType?: number;
    location?: number;
    rack?: number;
    section?: string;
  }>({});

  const loadDevices = useCallback(async (filterParams?: typeof filters) => {
    try {
      setLoading(true);
      setError(null);
      const params = filterParams || filters;
      const response = await ipamApi.getDevices(params);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setDevices(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load devices";
      console.error("[DevicesPage] Error loading devices:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadDeviceTypes = async () => {
    try {
      const response = await ipamApi.getDeviceTypes({ is_active: true });
      if (response.data) {
        setDeviceTypes(extractIpamArrayData(response.data));
      }
    } catch (err) {
      console.error("Error loading device types:", err);
    }
  };

  const loadLocations = async () => {
    try {
      const { api } = await import("@/lib/utils");
      const res = await api.get("/infrastructure/locations/");
      if (res.data) {
        const { extractIpamArrayData } = await import("@/lib/ipam-utils");
        setLocations(extractIpamArrayData(res.data) as Array<{ id: number; name: string }>);
      }
    } catch (err) {
      console.error("Error loading locations:", err);
    }
  };

  const loadRacks = async () => {
    try {
      const response = await ipamApi.getRacks();
      if (response.data) {
        setRacks(extractIpamArrayData(response.data));
      }
    } catch (err) {
      console.error("Error loading racks:", err);
    }
  };

  useEffect(() => {
    loadDevices();
    loadDeviceTypes();
    loadLocations();
    loadRacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters((prev) => {
      const same =
        prev.deviceType === newFilters.deviceType &&
        prev.location === newFilters.location &&
        prev.rack === newFilters.rack &&
        prev.section === newFilters.section;
      return same ? prev : newFilters;
    });
    loadDevices(newFilters);
  }, [loadDevices]);

  const handleEdit = (device: Device) => {
    router.push(`/ipam/devices/edit/${device.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this device?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteDevice(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadDevices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete device";
      console.error("[DevicesPage] Error deleting device:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/devices/new");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Devices" />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground px-1">Loading devices...</div>
      )}

      <DeviceTable
        devices={devices}
        onEdit={can("ipam.change_device") ? handleEdit : undefined}
        onDelete={can("ipam.delete_device") ? handleDelete : undefined}
        onAdd={can("ipam.add_device") ? handleAdd : undefined}
        deviceTypes={deviceTypes}
        locations={locations}
        racks={racks}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
