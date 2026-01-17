"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpLeaseTable } from "@/components/ipam/dhcp-lease-table";
import { DHCPLease } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

export default function DhcpLeasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeId = searchParams.get("scope");
  const [leases, setLeases] = useState<DHCPLease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeases = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = scopeId ? { scope: scopeId } : {};
      const response = await ipamApi.getDHCPLeases(params);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setLeases(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load DHCP leases";
      console.error("[DhcpLeasesPage] Error loading leases:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId]);


  const handleAdd = () => {
    router.push("/ipam/dhcp-leases/new");
  };

  const handleRelease = async (id: number) => {
    if (!confirm("Are you sure you want to release this DHCP lease?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.releaseDHCPLease(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadLeases();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to release DHCP lease";
      console.error("[DhcpLeasesPage] Error releasing lease:", err);
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="DHCP Leases" />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading DHCP leases...</div>
        </div>
      ) : (
        <DhcpLeaseTable
          leases={leases}
          onAdd={handleAdd}
          onRelease={handleRelease}
        />
      )}
    </div>
  );
}
