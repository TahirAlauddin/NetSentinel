"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Edit2, Plus } from "lucide-react";
import { ProviderRecord, ProviderCreateDto } from "@/types/providers";
import { TelecomApiClient } from "@/lib/api-client/telecom";

async function listProviders(): Promise<ProviderRecord[]> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.getProviders<
    ProviderRecord[] | { results: ProviderRecord[] }
  >();
  
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch providers");
  }

  const data = response.data;

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as any).results)
  ) {
    return (data as any).results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  console.warn("Unexpected providers data format:", data);
  return [];
}

async function createProvider(
  data: ProviderCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.createProvider(data);

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create provider",
    };
  }

  return {
    success: true,
    message: "Provider created successfully",
  };
}

async function deleteProvider(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.deleteProvider(id);

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to delete provider",
    };
  }

  return {
    success: true,
    message: "Provider deleted successfully",
  };
}

async function updateProvider(
  id: number,
  data: ProviderCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.updateProvider(id, data);

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to update provider",
    };
  }

  return {
    success: true,
    message: "Provider updated successfully",
  };
}

export default function ProvidersPage() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ProviderRecord>>({});
  const addFormRef = useRef<HTMLFormElement>(null);

  const handleAddProvider = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const data: ProviderCreateDto = {
      name: (formData.get("name") as string)?.trim() || "",
      description: (formData.get("description") as string)?.trim() || null,
      service_type: (formData.get("service_type") as string) || null,
      status: (formData.get("status") as string) || "active",
      account_number: (formData.get("account_number") as string)?.trim() || null,
      contact_name: (formData.get("contact_name") as string)?.trim() || null,
      contact_email: (formData.get("contact_email") as string)?.trim() || null,
      contact_phone: (formData.get("contact_phone") as string)?.trim() || null,
      website: (formData.get("website") as string)?.trim() || null,
      logo_url: (formData.get("logo_url") as string)?.trim() || null,
      monthly_cost: (formData.get("monthly_cost") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    if (!data.name) {
      toast.error("Name is required");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createProvider(data);

      if (result.success) {
        toast.success(result.message || "Provider created successfully!");
        const providerList = await listProviders();
        setProviders(Array.isArray(providerList) ? providerList : []);
        if (addFormRef.current) {
          addFormRef.current.reset();
        }
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create provider");
      }
    } catch (error) {
      console.error("Failed to add provider:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm("Are you sure you want to delete this provider?")) {
      return;
    }

    try {
      const result = await deleteProvider(id);

      if (result.success) {
        toast.success(result.message || "Provider deleted successfully!");
        const providerList = await listProviders();
        setProviders(Array.isArray(providerList) ? providerList : []);
      } else {
        toast.error(result.error || "Failed to delete provider");
      }
    } catch (error) {
      console.error("Failed to delete provider:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleStartEdit = (provider: ProviderRecord) => {
    setEditingId(provider.id);
    setEditData({
      name: provider.name,
      description: provider.description,
      service_type: provider.service_type,
      status: provider.status,
      account_number: provider.account_number,
      contact_name: provider.contact_name,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
      website: provider.website,
      logo_url: provider.logo_url,
      monthly_cost: provider.monthly_cost,
      notes: provider.notes,
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
      const result = await updateProvider(id, {
        name: editData.name?.trim() || "",
        description: editData.description?.trim() || null,
        service_type: editData.service_type || null,
        status: editData.status || "active",
        account_number: editData.account_number?.trim() || null,
        contact_name: editData.contact_name?.trim() || null,
        contact_email: editData.contact_email?.trim() || null,
        contact_phone: editData.contact_phone?.trim() || null,
        website: editData.website?.trim() || null,
        logo_url: editData.logo_url?.trim() || null,
        monthly_cost: editData.monthly_cost?.trim() || null,
        notes: editData.notes?.trim() || null,
      });

      if (result.success) {
        toast.success(result.message || "Provider updated successfully!");
        const providerList = await listProviders();
        setProviders(Array.isArray(providerList) ? providerList : []);
        setEditingId(null);
        setEditData({});
      } else {
        toast.error(result.error || "Failed to update provider");
      }
    } catch (error) {
      console.error("Failed to update provider:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  useEffect(() => {
    async function fetchProviders() {
      if (!session) {
        return;
      }

      try {
        const providerList = await listProviders();
        setProviders(Array.isArray(providerList) ? providerList : []);
      } catch (error) {
        console.error("Failed to fetch providers:", error);
        if (error instanceof Error && error.message.includes("Authentication required")) {
          console.warn("Authentication required for providers");
        } else if (error instanceof Error && !error.message.includes("401")) {
          toast.error("Failed to load providers");
        }
        setProviders([]);
      }
    }

    fetchProviders();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Providers</h1>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? "Cancel" : "Add Provider"}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Add New Provider
                </h2>
                <form ref={addFormRef} onSubmit={handleAddProvider} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Provider name"
                      />
                    </div>
                    <div>
                      <label htmlFor="service_type" className="block text-sm font-medium mb-2">
                        Service Type
                      </label>
                      <select
                        id="service_type"
                        name="service_type"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select service type</option>
                        <option value="voice">Voice</option>
                        <option value="data">Data</option>
                        <option value="internet">Internet</option>
                        <option value="mobile">Mobile</option>
                        <option value="consolidated">Consolidated</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        defaultValue="active"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="account_number" className="block text-sm font-medium mb-2">
                        Account Number
                      </label>
                      <input
                        id="account_number"
                        name="account_number"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Account number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact_name" className="block text-sm font-medium mb-2">
                        Contact Name
                      </label>
                      <input
                        id="contact_name"
                        name="contact_name"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact_email" className="block text-sm font-medium mb-2">
                        Contact Email
                      </label>
                      <input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact_phone" className="block text-sm font-medium mb-2">
                        Contact Phone
                      </label>
                      <input
                        id="contact_phone"
                        name="contact_phone"
                        type="tel"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="monthly_cost" className="block text-sm font-medium mb-2">
                        Monthly Cost
                      </label>
                      <input
                        id="monthly_cost"
                        name="monthly_cost"
                        type="number"
                        step="0.01"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium mb-2">
                        Website
                      </label>
                      <input
                        id="website"
                        name="website"
                        type="url"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="logo_url" className="block text-sm font-medium mb-2">
                        Logo URL
                      </label>
                      <input
                        id="logo_url"
                        name="logo_url"
                        type="url"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Provider description"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-2">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Additional notes"
                    />
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
                      {submitting ? "Adding..." : "Add Provider"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">
                Providers
              </h2>
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                {providers.length > 0 ? (
                  <div className="divide-y divide-border">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="p-4 hover:bg-[oklch(0.98_0_0)]"
                      >
                        {editingId === provider.id ? (
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
                                  Service Type
                                </label>
                                <select
                                  value={editData.service_type || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, service_type: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="">Select service type</option>
                                  <option value="voice">Voice</option>
                                  <option value="data">Data</option>
                                  <option value="internet">Internet</option>
                                  <option value="mobile">Mobile</option>
                                  <option value="consolidated">Consolidated</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Status
                                </label>
                                <select
                                  value={editData.status || "active"}
                                  onChange={(e) =>
                                    setEditData({ ...editData, status: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="pending">Pending</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Monthly Cost
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editData.monthly_cost || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, monthly_cost: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Contact Name
                                </label>
                                <input
                                  type="text"
                                  value={editData.contact_name || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, contact_name: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Contact Email
                                </label>
                                <input
                                  type="email"
                                  value={editData.contact_email || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, contact_email: e.target.value })
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
                                onClick={() => handleSaveEdit(provider.id)}
                                className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {provider.logo_url && (
                                  <img
                                    src={provider.logo_url}
                                    alt={provider.name}
                                    className="w-10 h-10 object-contain rounded"
                                  />
                                )}
                                <div>
                                  <h3 className="text-sm font-semibold text-[oklch(0.40_0.15_249)]">
                                    {provider.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    {provider.service_type_display && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                        {provider.service_type_display}
                                      </span>
                                    )}
                                    {provider.status_display && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        provider.status === "active" 
                                          ? "bg-green-100 text-green-700" 
                                          : provider.status === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}>
                                        {provider.status_display}
                                      </span>
                                    )}
                                    {provider.data_circuit_count !== undefined && (
                                      <span className="text-xs text-muted-foreground">
                                        {provider.data_circuit_count} service{provider.data_circuit_count !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                {provider.monthly_cost && (
                                  <p>
                                    <span className="font-medium">Monthly Cost:</span> ${parseFloat(provider.monthly_cost).toFixed(2)} /mon
                                  </p>
                                )}
                                {provider.account_number && (
                                  <p>
                                    <span className="font-medium">Account:</span> {provider.account_number}
                                  </p>
                                )}
                                {provider.contact_name && (
                                  <p>
                                    <span className="font-medium">Contact:</span> {provider.contact_name}
                                    {provider.contact_email && ` (${provider.contact_email})`}
                                    {provider.contact_phone && ` - ${provider.contact_phone}`}
                                  </p>
                                )}
                                {provider.website && (
                                  <p>
                                    <span className="font-medium">Website:</span>{" "}
                                    <a
                                      href={provider.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[oklch(0.62_0.25_27.3)] hover:underline"
                                    >
                                      {provider.website}
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleStartEdit(provider)}
                                className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProvider(provider.id)}
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
                    No providers found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

