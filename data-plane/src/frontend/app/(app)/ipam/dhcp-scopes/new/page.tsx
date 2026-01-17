"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpScopeForm } from "@/components/ipam/dhcp-scope-form";
import { DHCPScope, DHCPOption } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function NewDhcpScopePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<DHCPScope> & { _pendingOptions?: Partial<DHCPOption>[] }) => {
    try {
      setLoading(true);
      
      // Extract pending options before creating scope
      const pendingOptions = data._pendingOptions || [];
      delete (data as Partial<DHCPScope> & { _pendingOptions?: Partial<DHCPOption>[] })._pendingOptions;
      
      // Create the scope first
      const response = await ipamApi.createDHCPScope(data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const createdScope = response.data as DHCPScope;

      // Save options if any were configured
      if (pendingOptions.length > 0 && createdScope.id) {
        try {
          for (const option of pendingOptions) {
            await ipamApi.createDHCPScopeOption(createdScope.id, {
              ...option,
              scope: createdScope.id,
            });
          }
        } catch (optionError) {
          console.error("Error saving DHCP options:", optionError);
          // Don't fail the entire operation if options fail to save
          // The scope was created successfully, user can add options later
        }
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
