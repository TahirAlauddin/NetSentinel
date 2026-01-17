"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { CustomerForm } from "@/components/ipam/customer-form";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { CustomerCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CustomerCreateUpdateDto) => {
    setLoading(true);
    try {
      const response = await ipamApi.createCustomer(data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/customers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Add Customer" />
      <IpamNavTabs />
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/customers")}
        loading={loading}
      />
    </div>
  );
}

