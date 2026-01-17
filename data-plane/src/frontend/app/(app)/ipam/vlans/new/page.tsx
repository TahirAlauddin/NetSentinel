"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { VlanForm } from "@/components/ipam/vlan-form";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { VlanCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function NewVlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: VlanCreateUpdateDto) => {
    setLoading(true);
    try {
      const response = await ipamApi.createVlan(data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/vlans");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Add VLAN" />
      <IpamNavTabs />
      <VlanForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/vlans")}
        loading={loading}
      />
    </div>
  );
}

