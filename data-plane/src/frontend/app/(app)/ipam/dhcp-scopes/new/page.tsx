"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpScopeForm } from "@/components/ipam/dhcp-scope-form";
import { DHCPScope } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function NewDhcpScopePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<DHCPScope>) => {
    try {
      setLoading(true);
      const response = await ipamApi.createDHCPScope(data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/dhcp-scopes");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/dhcp-scopes");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="New DHCP Scope" />
      <IpamNavTabs />
      <DhcpScopeForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}
