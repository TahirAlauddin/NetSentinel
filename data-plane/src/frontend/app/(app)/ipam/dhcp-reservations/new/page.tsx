"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { DhcpReservationForm } from "@/components/ipam/dhcp-reservation-form";
import { DHCPReservation } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";

const ipamApi = new IpamApiClient();

export default function NewDhcpReservationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<DHCPReservation>) => {
    try {
      setLoading(true);
      const response = await ipamApi.createDHCPReservation(data);
      
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/ipam/dhcp-reservations");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/ipam/dhcp-reservations");
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="New DHCP Reservation" />
      <IpamNavTabs />
      <DhcpReservationForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}
