"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DeviceForm } from "@/components/ipam/device-form";
import { Device } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function NewDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<Device>) => {
    try {
      setLoading(true);
      const response = await ipamApi.createDevice(data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/devices");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/devices");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="New Device" />
      <IpamNavTabs />
      <DeviceForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}
