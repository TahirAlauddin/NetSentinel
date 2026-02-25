"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { SubnetForm } from "@/components/apps/ipam/subnet-form";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { SubnetCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function NewSubnetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SubnetCreateUpdateDto) => {
    setLoading(true);
    try {
      const response = await ipamApi.createSubnet(data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/subnets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Add Subnet" />
      <IpamNavTabs />
      <SubnetForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/subnets")}
        loading={loading}
      />
    </div>
  );
}

