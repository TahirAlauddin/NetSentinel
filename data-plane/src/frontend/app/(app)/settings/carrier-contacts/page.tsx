"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsNavTabs } from "@/components/settings/settings-nav-tabs";
import { SettingsHeader } from "@/components/settings/settings-header";
import { CarrierContactRecord, CarrierContactCreateDto } from "@/types/carrier-contacts";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { LocationRecord } from "@/types/locations";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

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
    Array.isArray((data as any).results)
  ) {
    return (data as any).results;
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
    Array.isArray((data as any).results)
  ) {
    return (data as any).results;
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
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<CarrierContactRecord>>({});
  const addFormRef = useRef<HTMLFormElement>(null);
  const infrastructureApiClient = new InfrastructureApiClient();

  const handleAddCarrierContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const locationValue = formData.get("location") as string;
    const data: CarrierContactCreateDto = {
      name: (formData.get("name") as string)?.trim() || "",
      location: locationValue ? parseInt(locationValue, 10) : null,
      customer_service_phone: (formData.get("customer_service_phone") as string)?.trim() || null,
      technical_support_phone: (formData.get("technical_support_phone") as string)?.trim() || null,
      sales_phone: (formData.get("sales_phone") as string)?.trim() || null,
      billing_phone: (formData.get("billing_phone") as string)?.trim() || null,
    };

    if (!data.name) {
      toast.error("Name is required");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createCarrierContact(data);

      if (result.success) {
        toast.success(result.message || "Carrier contact created successfully!");
        const contactList = await listCarrierContacts();
        setCarrierContacts(Array.isArray(contactList) ? contactList : []);
        if (addFormRef.current) {
          addFormRef.current.reset();
        }
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create carrier contact");
      }
    } catch (error) {
      console.error("Failed to add carrier contact:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
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

  const handleStartEdit = (contact: CarrierContactRecord) => {
    setEditingId(contact.id);
    setEditData({
      name: contact.name,
      location: contact.location,
      customer_service_phone: contact.customer_service_phone,
      technical_support_phone: contact.technical_support_phone,
      sales_phone: contact.sales_phone,
      billing_phone: contact.billing_phone,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async (id: number) => {
    if (!editData.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const result = await updateCarrierContact(id, {
        name: editData.name?.trim() || "",
        location: typeof editData.location === 'number' ? editData.location : null,
        customer_service_phone: editData.customer_service_phone?.trim() || null,
        technical_support_phone: editData.technical_support_phone?.trim() || null,
        sales_phone: editData.sales_phone?.trim() || null,
        billing_phone: editData.billing_phone?.trim() || null,
      });

      if (result.success) {
        toast.success(result.message || "Carrier contact updated successfully!");
        const contactList = await listCarrierContacts();
        setCarrierContacts(Array.isArray(contactList) ? contactList : []);
        setEditingId(null);
        setEditData({});
      } else {
        toast.error(result.error || "Failed to update carrier contact");
      }
    } catch (error) {
      console.error("Failed to update carrier contact:", error);
      toast.error("An unexpected error occurred. Please try again.");
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
        <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
          <SettingsSidebar />

          {/* Main content */}
          <div className="flex-1 p-8">
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
                        className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {showAddForm ? "Cancel" : "Add Carrier Contact"}
                      </button>
                    </div>

                    {/* Add Carrier Contact Form */}
                    {showAddForm && (
                      <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">
                          Add New Carrier Contact
                        </h2>
                        <form ref={addFormRef} onSubmit={handleAddCarrierContact} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="name"
                                className="block text-sm font-medium mb-2"
                              >
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                placeholder="Carrier name"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="location"
                                className="block text-sm font-medium mb-2"
                              >
                                Location
                              </label>
                              <select
                                id="location"
                                name="location"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="">Select a location</option>
                                {locations.map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.name} {loc.city ? `- ${loc.city}` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="customer_service_phone"
                                className="block text-sm font-medium mb-2"
                              >
                                Customer Service Phone
                              </label>
                              <input
                                id="customer_service_phone"
                                name="customer_service_phone"
                                type="tel"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="technical_support_phone"
                                className="block text-sm font-medium mb-2"
                              >
                                Technical Support Phone
                              </label>
                              <input
                                id="technical_support_phone"
                                name="technical_support_phone"
                                type="tel"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="sales_phone"
                                className="block text-sm font-medium mb-2"
                              >
                                Sales Phone
                              </label>
                              <input
                                id="sales_phone"
                                name="sales_phone"
                                type="tel"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="billing_phone"
                                className="block text-sm font-medium mb-2"
                              >
                                Billing Phone
                              </label>
                              <input
                                id="billing_phone"
                                name="billing_phone"
                                type="tel"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {submitting ? "Adding..." : "Add Carrier Contact"}
                            </button>
                          </div>
                        </form>
                      </div>
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
                                {editingId === contact.id ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={editData.name || ""}
                                          onChange={(e) =>
                                            setEditData({ ...editData, name: e.target.value })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                          autoFocus
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Location
                                        </label>
                                        <select
                                          value={editData.location || ""}
                                          onChange={(e) =>
                                            setEditData({ 
                                              ...editData, 
                                              location: e.target.value ? parseInt(e.target.value, 10) : null 
                                            })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                          <option value="">Select a location</option>
                                          {locations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                              {loc.name} {loc.city ? `- ${loc.city}` : ""}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Customer Service Phone
                                        </label>
                                        <input
                                          type="tel"
                                          value={editData.customer_service_phone || ""}
                                          onChange={(e) =>
                                            setEditData({
                                              ...editData,
                                              customer_service_phone: e.target.value,
                                            })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Technical Support Phone
                                        </label>
                                        <input
                                          type="tel"
                                          value={editData.technical_support_phone || ""}
                                          onChange={(e) =>
                                            setEditData({
                                              ...editData,
                                              technical_support_phone: e.target.value,
                                            })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Sales Phone
                                        </label>
                                        <input
                                          type="tel"
                                          value={editData.sales_phone || ""}
                                          onChange={(e) =>
                                            setEditData({ ...editData, sales_phone: e.target.value })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Billing Phone
                                        </label>
                                        <input
                                          type="tel"
                                          value={editData.billing_phone || ""}
                                          onChange={(e) =>
                                            setEditData({
                                              ...editData,
                                              billing_phone: e.target.value,
                                            })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveEdit(contact.id)}
                                        className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="text-sm font-semibold text-[oklch(0.40_0.15_249)] mb-2">
                                        {contact.name}
                                      </h3>
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        {contact.location_name && (
                                          <p>
                                            <span className="font-medium">Location:</span>{" "}
                                            {contact.location_name}
                                          </p>
                                        )}
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                          {contact.customer_service_phone && (
                                            <p>
                                              <span className="font-medium">Customer Service:</span>{" "}
                                              {contact.customer_service_phone}
                                            </p>
                                          )}
                                          {contact.technical_support_phone && (
                                            <p>
                                              <span className="font-medium">Technical Support:</span>{" "}
                                              {contact.technical_support_phone}
                                            </p>
                                          )}
                                          {contact.sales_phone && (
                                            <p>
                                              <span className="font-medium">Sales:</span>{" "}
                                              {contact.sales_phone}
                                            </p>
                                          )}
                                          {contact.billing_phone && (
                                            <p>
                                              <span className="font-medium">Billing:</span>{" "}
                                              {contact.billing_phone}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      <button
                                        onClick={() => handleStartEdit(contact)}
                                        className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCarrierContact(contact.id)}
                                        className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
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

