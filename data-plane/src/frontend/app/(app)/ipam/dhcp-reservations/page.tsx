"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpReservationTable } from "@/components/ipam/dhcp-reservation-table";
import { DHCPReservation } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

export default function DhcpReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeId = searchParams.get("scope");
  const [reservations, setReservations] = useState<DHCPReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = scopeId ? { scope: scopeId } : {};
      const response = await ipamApi.getDHCPReservations(params);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setReservations(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load DHCP reservations";
      console.error("[DhcpReservationsPage] Error loading reservations:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [scopeId]);

  const handleEdit = (reservation: DHCPReservation) => {
    router.push(`/ipam/dhcp-reservations/edit/${reservation.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this DHCP reservation?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteDHCPReservation(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadReservations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete DHCP reservation";
      console.error("[DhcpReservationsPage] Error deleting reservation:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/dhcp-reservations/new");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="DHCP Reservations" />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading DHCP reservations...</div>
        </div>
      ) : (
        <DhcpReservationTable
          reservations={reservations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
