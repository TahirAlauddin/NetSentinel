"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { VrfTable } from "@/components/apps/ipam/vrf-table";
import { VRF } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

export default function VrfsPage() {
  const router = useRouter();
  const [vrfs, setVrfs] = useState<VRF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVrfs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getVrfs();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setVrfs(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load VRFs";
      console.error("[VrfsPage] Error loading VRFs:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVrfs();
  }, []);

  const handleEdit = (vrf: VRF) => {
    router.push(`/ipam/vrfs/edit/${vrf.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this VRF?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteVrf(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadVrfs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete VRF";
      console.error("[VrfsPage] Error deleting VRF:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/vrfs/new");
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="VRFs"
      />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading VRFs...</div>
        </div>
      ) : (
        <VrfTable
          vrfs={vrfs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

