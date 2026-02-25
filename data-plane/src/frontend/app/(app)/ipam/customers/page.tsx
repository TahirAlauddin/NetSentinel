"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { CustomerTable } from "@/components/apps/ipam/customer-table";
import { Customer } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getCustomers();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setCustomers(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load customers";
      console.error("[CustomersPage] Error loading customers:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleEdit = (customer: Customer) => {
    router.push(`/ipam/customers/edit/${customer.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteCustomer(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadCustomers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete customer";
      console.error("[CustomersPage] Error deleting customer:", err);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/customers/new");
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="All customers"
      />
      <IpamNavTabs />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

