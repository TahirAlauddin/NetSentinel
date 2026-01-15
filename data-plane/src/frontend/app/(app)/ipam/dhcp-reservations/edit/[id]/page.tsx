"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpReservationForm } from "@/components/ipam/dhcp-reservation-form";
import { DHCPReservation } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function EditDhcpReservationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [reservation, setReservation] = useState<DHCPReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReservation = async () => {
      try {
        setLoading(true);
        const response = await ipamApi.getDHCPReservation(id);
        
        if (response.error) {
          throw new Error(response.error);
        }

        setReservation(response.data as DHCPReservation);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load DHCP reservation";
        console.error("[EditDhcpReservationPage] Error loading reservation:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadReservation();
    }
  }, [id]);

  const handleSubmit = async (data: Partial<DHCPReservation>) => {
    try {
      setSaving(true);
      const response = await ipamApi.updateDHCPReservation(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/dhcp-reservations");
    } catch (err) {
      setSaving(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/dhcp-reservations");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit DHCP Reservation" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading DHCP reservation...</div>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit DHCP Reservation" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "DHCP reservation not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit DHCP Reservation" />
      <IpamNavTabs />
      <DhcpReservationForm
        reservation={reservation}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
      />
    </div>
  );
}
