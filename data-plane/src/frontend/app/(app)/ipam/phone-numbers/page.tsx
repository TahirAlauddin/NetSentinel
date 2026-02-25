"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IpamHeader } from "@/components/apps/ipam/ipam-header";
import { IpamNavTabs } from "@/components/apps/ipam/ipam-nav-tabs";
import { PhoneNumberTable } from "@/components/apps/ipam/phone-number-table";
import { PhoneNumberForm } from "@/components/apps/ipam/phone-number-form";
import { PhoneNumberRange } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

/**
 * Phone Numbers Page
 * Displays a list of phone number ranges with filtering, sorting, and CRUD operations
 */
export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState<PhoneNumberRange | undefined>();

  const loadPhoneNumbers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getPhoneNumberRanges();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setPhoneNumbers(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load phone number ranges";
      console.error("[PhoneNumbersPage] Error loading phone numbers:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  const handleEdit = (phoneNumber: PhoneNumberRange) => {
    setEditingPhoneNumber(phoneNumber);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this phone number range?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deletePhoneNumberRange(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadPhoneNumbers();
      toast.success("Phone number range deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete phone number range";
      console.error("[PhoneNumbersPage] Error deleting phone number range:", err);
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    setEditingPhoneNumber(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    loadPhoneNumbers();
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingPhoneNumber(undefined);
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Phone Numbers" />
      <IpamNavTabs />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading phone number ranges...</div>
          </div>
        ) : (
          <PhoneNumberTable
            phoneNumbers={phoneNumbers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </div>

      {/* Form Dialog */}
      <PhoneNumberForm
        phoneNumber={editingPhoneNumber}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
