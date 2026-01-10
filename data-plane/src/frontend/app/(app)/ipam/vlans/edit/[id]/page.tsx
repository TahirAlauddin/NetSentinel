"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { VlanForm } from "@/components/ipam/vlan-form";
import { VLAN } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { VlanCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function EditVlanPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [vlan, setVlan] = useState<VLAN | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVlan = async () => {
      try {
        const response = await ipamApi.getVlan(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setVlan(response.data as VLAN);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load VLAN");
      } finally {
        setLoading(false);
      }
    };
    loadVlan();
  }, [id]);

  const handleSubmit = async (data: VlanCreateUpdateDto) => {
    setSaving(true);
    try {
      const response = await ipamApi.updateVlan(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/vlans");
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit VLAN" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading VLAN...</div>
        </div>
      </div>
    );
  }

  if (error || !vlan) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit VLAN" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "VLAN not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit VLAN" />
      <IpamNavTabs />
      <VlanForm
        vlan={vlan}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/vlans")}
        loading={saving}
      />
    </div>
  );
}

