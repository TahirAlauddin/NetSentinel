"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsNavTabs } from "@/components/settings/settings-nav-tabs";
import { SettingsHeader } from "@/components/settings/settings-header";
import { CarrierContactRecord, CarrierContactCreateDto } from "@/types/carrier-contacts";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { LocationRecord } from "@/types/locations";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CarrierContactAddForm } from "@/components/settings/carrier-contact-add-form";
import { CarrierContactItem } from "@/components/settings/carrier-contact-item";

async function listCarrierContacts(): Promise<CarrierContactRecord[]> {
  const apiClient = new InfrastructureApiClient();
  const response = await apiClient.getCarrierContacts<
    CarrierContactRecord[] | { results: CarrierContactRecord[] }
  >();
  
  // Handle authentication errors gracefully
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch carrier contacts");
  }

  const data = response.data;

  // Handle paginated response
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: CarrierContactRecord[] }).results)
  ) {
    return (data as { results: CarrierContactRecord[] }).results;
  }

  // Handle direct array response
  if (Array.isArray(data)) {
    return data;
  }

  console.warn("Unexpected carrier contacts data format:", data);
  return [];
}

async function createCarrierContact(
  data: CarrierContactCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new InfrastructureApiClient();
  const response = await apiClient.createCarrierContact(data);

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create carrier contact",
    };
  }

  return {
    success: true,
    message: "Carrier contact created successfully",
  };
}

async function deleteCarrierContact(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new InfrastructureApiClient();
  const response = await apiClient.deleteCarrierContact(id);

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to delete carrier contact",
    };
  }

  return {
    success: true,
    message: "Carrier contact deleted successfully",
  };
}

async function updateCarrierContact(
  id: number,
  data: CarrierContactCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new InfrastructureApiClient();
  const response = await apiClient.updateCarrierContact(id, data);

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to update carrier contact",
    };
  }

  return {
    success: true,
    message: "Carrier contact updated successfully",
  };
}

async function listLocations(): Promise<LocationRecord[]> {
  const apiClient = new InfrastructureApiClient();
  const response = await apiClient.getLocations<
    LocationRecord[] | { results: LocationRecord[] }
  >();
  
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch locations");
  }

  const data = response.data;

  // Handle paginated response
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: LocationRecord[] }).results)
  ) {
    return (data as { results: LocationRecord[] }).results;
  }

  // Handle direct array response
  if (Array.isArray(data)) {
    return data;
  }

  console.warn("Unexpected locations data format:", data);
  return [];
}

export default function CarrierContactsPage() {
  const { data: session } = useSession();
  const [carrierContacts, setCarrierContacts] = useState<CarrierContactRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCarrierContact = async (data: CarrierContactCreateDto) => {
    try {
      const result = await createCarrierContact(data);

      if (result.success) {
        toast.success(result.message || "Carrier contact created successfully!");
        const contactList = await listCarrierContacts();
        setCarrierContacts(Array.isArray(contactList) ? contactList : []);
        setShowAddForm(false);
        return true;
      } else {
        toast.error(result.error || "Failed to create carrier contact");
        return false;
      }
    } catch (error) {
      console.error("Failed to add carrier contact:", error);
      toast.error("An unexpected error occurred. Please try again.");
      return false;
    }
  };

  const handleDeleteCarrierContact = async (id: number) => {
    if (!confirm("Are you sure you want to delete this carrier contact?")) {
      return;
    }

    try {
      const result = await deleteCarrierContact(id);

      if (result.success) {
        toast.success(result.message || "Carrier contact deleted successfully!");
        const contactList = await listCarrierContacts();
        setCarrierContacts(Array.isArray(contactList) ? contactList : []);
      } else {
        toast.error(result.error || "Failed to delete carrier contact");
      }
    } catch (error) {
      console.error("Failed to delete carrier contact:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleUpdateCarrierContact = async (id: number, data: CarrierContactCreateDto) => {
    try {
      const result = await updateCarrierContact(id, data);

      if (result.success) {
        toast.success(result.message || "Carrier contact updated successfully!");
        const contactList = await listCarrierContacts();
        setCarrierContacts(Array.isArray(contactList) ? contactList : []);
        return true;
      } else {
        toast.error(result.error || "Failed to update carrier contact");
        return false;
      }
    } catch (error) {
      console.error("Failed to update carrier contact:", error);
      toast.error("An unexpected error occurred. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    async function fetchCarrierContacts() {
      // Only fetch if user is authenticated
      if (!session) {
        return;
      }

      try {
        const contactList = await listCarrierContacts();
        setCarrierContacts(Array.isArray(contactList) ? contactList : []);
      } catch (error) {
        console.error("Failed to fetch carrier contacts:", error);
        // Don't show error toast for authentication errors - ProtectedRoute handles redirect
        if (error instanceof Error && error.message.includes("Authentication required")) {
          console.warn("Authentication required for carrier contacts");
        } else if (error instanceof Error && !error.message.includes("401")) {
          toast.error("Failed to load carrier contacts");
        }
        setCarrierContacts([]);
      }
    }

    async function fetchLocations() {
      // Only fetch if user is authenticated
      if (!session) {
        return;
      }

      try {
        const locationList = await listLocations();
        setLocations(Array.isArray(locationList) ? locationList : []);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        // Don't show error toast for authentication errors
        if (error instanceof Error && !error.message.includes("Authentication required")) {
          console.warn("Failed to load locations for dropdown");
        }
        setLocations([]);
      }
    }

    fetchCarrierContacts();
    fetchLocations();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          {/* Main content */}
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Carrier Contacts" />
              <SettingsNavTabs />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Add Carrier Contact Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {showAddForm ? "Cancel" : "Add Carrier Contact"}
                      </button>
                    </div>

                    {/* Add Carrier Contact Form */}
                    {showAddForm && (
                      <CarrierContactAddForm
                        locations={locations}
                        onSubmit={handleAddCarrierContact}
                        onCancel={() => setShowAddForm(false)}
                      />
                    )}

                    {/* Carrier Contacts list */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Carrier Contacts
                      </h2>
                      <div className="border border-border rounded-lg overflow-hidden bg-card">
                        {carrierContacts.length > 0 ? (
                          <div className="divide-y divide-border">
                            {carrierContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="p-4 hover:bg-[oklch(0.98_0_0)]"
                              >
                                <CarrierContactItem
                                  contact={contact}
                                  locations={locations}
                                  onUpdate={handleUpdateCarrierContact}
                                  onDelete={handleDeleteCarrierContact}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No carrier contacts found
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

