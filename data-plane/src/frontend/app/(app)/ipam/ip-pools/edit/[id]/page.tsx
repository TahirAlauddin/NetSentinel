"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { IpPoolForm } from "@/components/apps/ipam/ip-pool-form";
import { Button } from "@/components/ui/button";
import { IPPool } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { validateRouteIdString } from "@/lib/security/input-validation";

const ipamApi = new IpamApiClient();

export default function EditIpPoolPage() {
  const router = useRouter();
  const params = useParams();
  const id = validateRouteIdString(params.id);
  const [pool, setPool] = useState<IPPool | null>(null);
  const [loading, setLoading] = useState(id !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;
    const loadPool = async () => {
      try {
        setLoading(true);
        const response = await ipamApi.getIPPool(id);

        if (response.error) {
          throw new Error(response.error);
        }

        setPool(response.data as IPPool);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load IP pool";
        console.error("[EditIpPoolPage] Error loading pool:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPool();
  }, [id]);

  const handleSubmit = async (data: Partial<IPPool>) => {
    if (id === null) return;
    try {
      setSaving(true);
      const response = await ipamApi.updateIPPool(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/ip-pools");
    } catch (err) {
      setSaving(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/ip-pools");
  };

  if (id === null) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit IP Pool" />
        <IpamNavTabs />
        <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-800">
          Invalid IP pool ID. Please use a valid link or go back to the list.
        </div>
        <Button variant="outline" onClick={() => router.push("/ipam/ip-pools")}>
          Back to IP pools
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit IP Pool" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading IP pool...</div>
        </div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit IP Pool" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "IP pool not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit IP Pool" />
      <IpamNavTabs />
      <IpPoolForm pool={pool} onSubmit={handleSubmit} onCancel={handleCancel} loading={saving} />
    </div>
  );
}
