"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { SubnetGroupForm } from "@/components/ipam/subnet-group-form";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { SubnetGroupCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function NewSubnetGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SubnetGroupCreateUpdateDto) => {
    setLoading(true);
    try {
      const response = await ipamApi.createSubnetGroup(data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/subnet-groups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Add Subnet Group" />
      <IpamNavTabs />
      <SubnetGroupForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/subnet-groups")}
        loading={loading}
      />
    </div>
  );
}

