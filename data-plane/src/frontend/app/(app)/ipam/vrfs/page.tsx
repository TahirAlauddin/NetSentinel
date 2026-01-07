"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { VrfTable } from "@/components/ipam/vrf-table";
import { VRF } from "@/types/ipam";
import { api } from "@/lib/utils";

export default function VrfsPage() {
  const router = useRouter();
  const [vrfs, setVrfs] = useState<VRF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVrfs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<VRF[] | { results: VRF[] }>("/api/v1/ipam/vrfs/");
        
        if (response.error) {
          throw new Error(response.error);
        }

        let data: VRF[] = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && typeof response.data === "object" && "results" in response.data) {
          data = (response.data as { results: VRF[] }).results;
        }

        setVrfs(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load VRFs";
        console.error("[VrfsPage] Error loading VRFs:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

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
      const response = await api.delete(`/api/v1/ipam/vrfs/${id}/`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setVrfs((prev) => prev.filter((v) => v.id !== id));
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
        breadcrumbs={[
          { label: "Tools", href: "#" },
          { label: "VRF" },
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

