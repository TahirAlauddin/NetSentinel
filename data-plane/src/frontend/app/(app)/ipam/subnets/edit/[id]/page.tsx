"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { SubnetForm } from "@/components/apps/ipam/subnet-form";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { SubnetCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function EditSubnetPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [subnet, setSubnet] = useState<Subnet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubnet = async () => {
      try {
        const response = await ipamApi.getSubnet(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setSubnet(response.data as Subnet);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load subnet");
      } finally {
        setLoading(false);
      }
    };
    loadSubnet();
  }, [id]);

  const handleSubmit = async (data: SubnetCreateUpdateDto) => {
    setSaving(true);
    try {
      const response = await ipamApi.updateSubnet(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/subnets");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Subnet" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading subnet...</div>
        </div>
      </div>
    );
  }

  if (error || !subnet) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Subnet" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "Subnet not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit Subnet" />
      <IpamNavTabs />
      <SubnetForm
        subnet={subnet}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/subnets")}
        loading={saving}
      />
    </div>
  );
}

