"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { VlanTable } from "@/components/ipam/vlan-table";
import { VLAN } from "@/types/ipam";
import { api } from "@/lib/utils";

export default function VlansPage() {
  const router = useRouter();
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<VLAN[] | { results: VLAN[] }>("/api/v1/ipam/vlans/");
        
        if (response.error) {
          throw new Error(response.error);
        }

        let data: VLAN[] = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && typeof response.data === "object" && "results" in response.data) {
          data = (response.data as { results: VLAN[] }).results;
        }

        setVlans(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load VLANs";
        console.error("[VlansPage] Error loading VLANs:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadVlans();
  }, []);

  const handleEdit = (vlan: VLAN) => {
    router.push(`/ipam/vlans/edit/${vlan.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this VLAN?")) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/api/v1/ipam/vlans/${id}/`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setVlans((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete VLAN";
      console.error("[VlansPage] Error deleting VLAN:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/vlans/new");
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="VLANs"
        breadcrumbs={[
          { label: "Tools", href: "#" },
          { label: "VLAN" },
        ]}
      />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading VLANs...</div>
        </div>
      ) : (
        <VlanTable
          vlans={vlans}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

