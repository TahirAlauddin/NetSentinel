"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpScopeTable } from "@/components/ipam/dhcp-scope-table";
import { DHCPScope } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

export default function DhcpScopesPage() {
  const router = useRouter();
  const [scopes, setScopes] = useState<DHCPScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScopes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getDHCPScopes();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setScopes(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load DHCP scopes";
      console.error("[DhcpScopesPage] Error loading scopes:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScopes();
  }, []);

  const handleEdit = (scope: DHCPScope) => {
    router.push(`/ipam/dhcp-scopes/edit/${scope.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this DHCP scope?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteDHCPScope(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadScopes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete DHCP scope";
      console.error("[DhcpScopesPage] Error deleting scope:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/dhcp-scopes/new");
  };

  const handleViewLeases = (scope: DHCPScope) => {
    router.push(`/ipam/dhcp-leases?scope=${scope.id}`);
  };

  const handleViewReservations = (scope: DHCPScope) => {
    router.push(`/ipam/dhcp-reservations?scope=${scope.id}`);
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="DHCP Scopes" />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading DHCP scopes...</div>
        </div>
      ) : (
        <DhcpScopeTable
          scopes={scopes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          onViewLeases={handleViewLeases}
          onViewReservations={handleViewReservations}
        />
      )}
    </div>
  );
}
