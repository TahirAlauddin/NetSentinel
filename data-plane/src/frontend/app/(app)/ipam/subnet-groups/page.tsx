"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { SubnetGroupTable } from "@/components/apps/ipam/subnet-group-table";
import { SubnetGroup } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { usePermissions } from "@/contexts/permissions-context";

const ipamApi = new IpamApiClient();

export default function SubnetGroupsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [groups, setGroups] = useState<SubnetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getSubnetGroups();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setGroups(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load subnet groups";
      console.error("[SubnetGroupsPage] Error loading subnet groups:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleEdit = (group: SubnetGroup) => {
    router.push(`/ipam/subnet-groups/edit/${group.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subnet group?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteSubnetGroup(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadGroups();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete subnet group";
      console.error("[SubnetGroupsPage] Error deleting subnet group:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/subnet-groups/new");
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="Subnet Groups"
      />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading subnet groups...</div>
        </div>
      ) : (
        <SubnetGroupTable
          groups={groups}
          onEdit={can("ipam.change_subnetgroup") ? handleEdit : undefined}
          onDelete={can("ipam.delete_subnetgroup") ? handleDelete : undefined}
          onAdd={can("ipam.add_subnetgroup") ? handleAdd : undefined}
        />
      )}
    </div>
  );
}

