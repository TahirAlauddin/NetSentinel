"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { VrfForm } from "@/components/apps/ipam/vrf-form";
import { VRF } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { VrfCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function EditVrfPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [vrf, setVrf] = useState<VRF | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVrf = async () => {
      try {
        const response = await ipamApi.getVrf(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setVrf(response.data as VRF);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load VRF");
      } finally {
        setLoading(false);
      }
    };
    loadVrf();
  }, [id]);

  const handleSubmit = async (data: VrfCreateUpdateDto) => {
    setSaving(true);
    try {
      const response = await ipamApi.updateVrf(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/vrfs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit VRF" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading VRF...</div>
        </div>
      </div>
    );
  }

  if (error || !vrf) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit VRF" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "VRF not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit VRF" />
      <IpamNavTabs />
      <VrfForm
        vrf={vrf}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/vrfs")}
        loading={saving}
      />
    </div>
  );
}

