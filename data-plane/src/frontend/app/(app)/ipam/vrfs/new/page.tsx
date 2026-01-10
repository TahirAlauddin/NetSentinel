"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { VrfForm } from "@/components/ipam/vrf-form";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { VrfCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function NewVrfPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: VrfCreateUpdateDto) => {
    setLoading(true);
    try {
      const response = await ipamApi.createVrf(data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/vrfs");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Add VRF" />
      <IpamNavTabs />
      <VrfForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/vrfs")}
        loading={loading}
      />
    </div>
  );
}

