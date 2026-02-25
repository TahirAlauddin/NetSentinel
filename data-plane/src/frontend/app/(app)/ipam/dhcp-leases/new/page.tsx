"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { DhcpLeaseForm } from "@/components/apps/ipam/dhcp-lease-form";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function NewDhcpLeasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: {
    scope: number;
    ip_address: string;
    mac_address: string;
    hostname?: string;
    lease_duration?: number;
  }) => {
    try {
      setLoading(true);
      const response = await ipamApi.createDHCPLease(data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/dhcp-leases");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/dhcp-leases");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="New DHCP Lease" />
      <IpamNavTabs />
      <DhcpLeaseForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}
