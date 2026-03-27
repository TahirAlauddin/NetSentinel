"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { IpPoolTable } from "@/components/apps/ipam/ip-pool-table";
import { IPPool } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { usePermissions } from "@/contexts/permissions-context";

const ipamApi = new IpamApiClient();

export default function IpPoolsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [pools, setPools] = useState<IPPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPools = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getIPPools();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setPools(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load IP pools";
      console.error("[IpPoolsPage] Error loading pools:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  const handleEdit = (pool: IPPool) => {
    router.push(`/ipam/ip-pools/edit/${pool.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this IP pool?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteIPPool(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadPools();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete IP pool";
      console.error("[IpPoolsPage] Error deleting pool:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/ip-pools/new");
  };

  const handleViewUtilization = (pool: IPPool) => {
    router.push(`/ipam/ip-pools/${pool.id}/utilization`);
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="IP Pools" />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading IP pools...</div>
        </div>
      ) : (
        <IpPoolTable
          pools={pools}
          onEdit={can("ipam.change_ippool") ? handleEdit : undefined}
          onDelete={can("ipam.delete_ippool") ? handleDelete : undefined}
          onAdd={can("ipam.add_ippool") ? handleAdd : undefined}
          onViewUtilization={handleViewUtilization}
        />
      )}
    </div>
  );
}
