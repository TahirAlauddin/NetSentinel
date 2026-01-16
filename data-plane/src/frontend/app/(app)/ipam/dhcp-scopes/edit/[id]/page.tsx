"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpScopeForm } from "@/components/ipam/dhcp-scope-form";
import { DHCPScope, DHCPOption } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function EditDhcpScopePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [scope, setScope] = useState<DHCPScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScope = async () => {
      try {
        setLoading(true);
        const response = await ipamApi.getDHCPScope(id);
        
        if (response.error) {
          throw new Error(response.error);
        }

        setScope(response.data as DHCPScope);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load DHCP scope";
        console.error("[EditDhcpScopePage] Error loading scope:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadScope();
    }
  }, [id]);

  const handleSubmit = async (data: Partial<DHCPScope>) => {
    try {
      setSaving(true);
      const response = await ipamApi.updateDHCPScope(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Reload scope to get updated data including options
      const updatedResponse = await ipamApi.getDHCPScope(id);
      if (!updatedResponse.error) {
        setScope(updatedResponse.data as DHCPScope);
      }
    } catch (err) {
      setSaving(false);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleOptionsChange = async (options: Partial<DHCPOption>[]) => {
    try {
      // Get current options
      const currentOptionsResponse = await ipamApi.getDHCPScopeOptions(id);
      const currentOptions = currentOptionsResponse.data as DHCPOption[] || [];

      // Delete options that are no longer present
      const newOptionCodes = new Set(options.map((opt) => opt.option_code));
      for (const currentOption of currentOptions) {
        if (!newOptionCodes.has(currentOption.option_code)) {
          await ipamApi.deleteDHCPOption(currentOption.id);
        }
      }

      // Create or update options
      for (const option of options) {
        const existingOption = currentOptions.find(
          (opt) => opt.option_code === option.option_code
        );

        if (existingOption) {
          // Update existing option
          await ipamApi.updateDHCPOption(existingOption.id, option);
        } else {
          // Create new option
          await ipamApi.createDHCPScopeOption(id, option);
        }
      }

      // Reload scope to get updated options
      const updatedResponse = await ipamApi.getDHCPScope(id);
      if (!updatedResponse.error) {
        setScope(updatedResponse.data as DHCPScope);
      }
    } catch (err) {
      console.error("Error saving DHCP options:", err);
    }
  };

  const handleCancel = () => {
    router.push("/ipam/dhcp-scopes");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit DHCP Scope" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading DHCP scope...</div>
        </div>
      </div>
    );
  }

  if (error || !scope) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit DHCP Scope" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "DHCP scope not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit DHCP Scope" />
      <IpamNavTabs />
      <DhcpScopeForm
        scope={scope}
        onSubmit={handleSubmit}
        onOptionsChange={handleOptionsChange}
        onCancel={handleCancel}
        loading={saving}
      />
    </div>
  );
}
