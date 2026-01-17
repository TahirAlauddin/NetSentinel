"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DeviceForm } from "@/components/ipam/device-form";
import { Device } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function EditDevicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDevice = async () => {
      try {
        setLoading(true);
        const response = await ipamApi.getDevice(id);
        
        if (response.error) {
          throw new Error(response.error);
        }

        setDevice(response.data as Device);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load device";
        console.error("[EditDevicePage] Error loading device:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDevice();
    }
  }, [id]);

  const handleSubmit = async (data: Partial<Device>) => {
    try {
      setSaving(true);
      const response = await ipamApi.updateDevice(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/devices");
    } catch (err) {
      setSaving(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/devices");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Device" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading device...</div>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Device" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "Device not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit Device" />
      <IpamNavTabs />
      <DeviceForm device={device} onSubmit={handleSubmit} onCancel={handleCancel} loading={saving} />
    </div>
  );
}
