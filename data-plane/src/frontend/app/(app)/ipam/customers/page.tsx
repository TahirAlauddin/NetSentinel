"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { CustomerTable } from "@/components/ipam/customer-table";
import { Customer } from "@/types/ipam";
import { api } from "@/lib/utils";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<Customer[] | { results: Customer[] }>("/api/v1/ipam/customers/");
        
        if (response.error) {
          throw new Error(response.error);
        }

        let data: Customer[] = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && typeof response.data === "object" && "results" in response.data) {
          data = (response.data as { results: Customer[] }).results;
        }

        setCustomers(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load customers";
        console.error("[CustomersPage] Error loading customers:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

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
      const response = await api.delete(`/api/v1/ipam/customers/${id}/`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setCustomers((prev) => prev.filter((c) => c.id !== id));
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
        breadcrumbs={[
          { label: "Tools", href: "#" },
          { label: "Subnets", href: "#" },
          { label: "Customers" },
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

