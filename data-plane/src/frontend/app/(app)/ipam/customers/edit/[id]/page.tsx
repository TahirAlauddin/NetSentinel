"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { CustomerForm } from "@/components/ipam/customer-form";
import { Customer } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { CustomerCreateUpdateDto } from "@/types/ipam/dto";

const ipamApi = new IpamApiClient();

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const response = await ipamApi.getCustomer(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setCustomer(response.data as Customer);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customer");
      } finally {
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id]);

  const handleSubmit = async (data: CustomerCreateUpdateDto) => {
    setSaving(true);
    try {
      const response = await ipamApi.updateCustomer(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/ipam/customers");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Customer" />
        <IpamNavTabs />
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading customer...</div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <IpamHeader currentPage="Edit Customer" />
        <IpamNavTabs />
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error || "Customer not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Edit Customer" />
      <IpamNavTabs />
      <CustomerForm
        customer={customer}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ipam/customers")}
        loading={saving}
      />
    </div>
  );
}

