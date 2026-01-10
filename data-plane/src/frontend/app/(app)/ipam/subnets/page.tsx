"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { SubnetTable } from "@/components/ipam/subnet-table";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

/**
 * Subnets Page
 * Displays a list of subnets with filtering, sorting, and search functionality
 */
export default function SubnetsPage() {
  const router = useRouter();
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubnets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getSubnets();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setSubnets(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load subnets";
      console.error("[SubnetsPage] Error loading subnets:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load subnets from API
  useEffect(() => {
    loadSubnets();
  }, []);

  const handleEdit = (subnet: Subnet) => {
    router.push(`/ipam/subnets/edit/${subnet.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subnet?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteSubnet(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadSubnets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete subnet";
      console.error("[SubnetsPage] Error deleting subnet:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/subnets/new");
  };

  const handleFind = () => {
    // TODO: Implement find subnet functionality
  };

  const handleToggleFavorite = async (subnet: Subnet) => {
    try {
      setError(null);
      const response = await ipamApi.toggleSubnetFavorite(subnet.id, !subnet.is_favorite);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Update the subnet in the list optimistically
      setSubnets((prevSubnets) =>
        prevSubnets.map((s) =>
          s.id === subnet.id
            ? { ...s, is_favorite: !subnet.is_favorite }
            : s
        )
      );

      toast.success(
        subnet.is_favorite
          ? "Removed from favorites"
          : "Added to favorites"
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update favorite status";
      console.error("[SubnetsPage] Error toggling favorite:", err);
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="Subnets"
      />
      <IpamNavTabs />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div>
        {/* Main Content Area */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading subnets...</div>
            </div>
          ) : (
            <SubnetTable
              subnets={subnets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onFind={handleFind}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>
      </div>
    </div>
  );
}

