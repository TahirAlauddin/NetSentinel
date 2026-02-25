"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { IpPoolForm } from "@/components/apps/ipam/ip-pool-form";
import { IPPool } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function NewIpPoolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<IPPool>) => {
    try {
      setLoading(true);
      const response = await ipamApi.createIPPool(data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/ip-pools");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/ip-pools");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="New IP Pool" />
      <IpamNavTabs />
      <IpPoolForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}
