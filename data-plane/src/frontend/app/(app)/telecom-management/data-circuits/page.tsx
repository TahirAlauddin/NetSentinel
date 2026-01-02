"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Edit2, Plus } from "lucide-react";
import { DataCircuitRecord, DataCircuitCreateDto } from "@/types/data-circuits";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { LocationRecord } from "@/types/locations";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { ProviderRecord } from "@/types/providers";

async function listDataCircuits(): Promise<DataCircuitRecord[]> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.getDataCircuits<
    DataCircuitRecord[] | { results: DataCircuitRecord[] }
  >();
  
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch data circuits");
  }

  const data = response.data;

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: DataCircuitRecord[] }).results)
  ) {
    return (data as { results: DataCircuitRecord[] }).results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  console.warn("Unexpected data circuits data format:", data);
  return [];
}

async function createDataCircuit(
  data: DataCircuitCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.createDataCircuit(data);

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create data circuit",
    };
  }

  return {
    success: true,
    message: "Data circuit created successfully",
  };
}

async function deleteDataCircuit(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.deleteDataCircuit(id);

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to delete data circuit",
    };
  }

  return {
    success: true,
    message: "Data circuit deleted successfully",
  };
}

async function updateDataCircuit(
  id: number,
  data: DataCircuitCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.updateDataCircuit(id, data);

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to update data circuit",
    };
  }

  return {
    success: true,
    message: "Data circuit updated successfully",
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

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: DataCircuitRecord[] }).results)
  ) {
    return (data as { results: DataCircuitRecord[] }).results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  console.warn("Unexpected locations data format:", data);
  return [];
}

async function listProviders(): Promise<ProviderRecord[]> {
  const apiClient = new TelecomApiClient();
  const response = await apiClient.getProviders<
    ProviderRecord[] | { results: ProviderRecord[] }
  >();
  
  if (response.status === 401) {
    throw new Error("Authentication required. Please log in.");
  }
  
  if (response.error || !response.data) {
    return [];
  }

  const data = response.data;

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: DataCircuitRecord[] }).results)
  ) {
    return (data as { results: DataCircuitRecord[] }).results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export default function DataCircuitsPage() {
  const { data: session } = useSession();
  const [dataCircuits, setDataCircuits] = useState<DataCircuitRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<DataCircuitRecord>>({});
  const [handoffType, setHandoffType] = useState<string>("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const handleAddDataCircuit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const locationValue = formData.get("location") as string;
    const providerValue = formData.get("provider") as string;
    const focDate = formData.get("foc_date") as string;
    const ttuDate = formData.get("ttu_date") as string;

    const data: DataCircuitCreateDto = {
      provider: providerValue ? parseInt(providerValue, 10) : null,
      location: locationValue ? parseInt(locationValue, 10) : null,
      circuit_id: (formData.get("circuit_id") as string)?.trim() || null,
      alternate_cid: (formData.get("alternate_cid") as string)?.trim() || null,
      carrier: (formData.get("carrier") as string)?.trim() || null,
      account_number: (formData.get("account_number") as string)?.trim() || null,
      security_code: (formData.get("security_code") as string)?.trim() || null,
      circuit_type: (formData.get("circuit_type") as string) || null,
      line_speed: (formData.get("line_speed") as string) || null,
      port_speed: (formData.get("port_speed") as string)?.trim() || null,
      handoff_type: (formData.get("handoff_type") as string) || null,
      fiber_type: (formData.get("fiber_type") as string) || null,
      connector_type: (formData.get("connector_type") as string) || null,
      quote_id: (formData.get("quote_id") as string)?.trim() || null,
      contract_id: (formData.get("contract_id") as string)?.trim() || null,
      foc_date: focDate || null,
      ttu_date: ttuDate || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    try {
      const result = await createDataCircuit(data);

      if (result.success) {
        toast.success(result.message || "Data circuit created successfully!");
        const circuitList = await listDataCircuits();
        setDataCircuits(Array.isArray(circuitList) ? circuitList : []);
        if (addFormRef.current) {
          addFormRef.current.reset();
        }
        setShowAddForm(false);
        setHandoffType("");
      } else {
        toast.error(result.error || "Failed to create data circuit");
      }
    } catch (error) {
      console.error("Failed to add data circuit:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDataCircuit = async (id: number) => {
    if (!confirm("Are you sure you want to delete this data circuit?")) {
      return;
    }

    try {
      const result = await deleteDataCircuit(id);

      if (result.success) {
        toast.success(result.message || "Data circuit deleted successfully!");
        const circuitList = await listDataCircuits();
        setDataCircuits(Array.isArray(circuitList) ? circuitList : []);
      } else {
        toast.error(result.error || "Failed to delete data circuit");
      }
    } catch (error) {
      console.error("Failed to delete data circuit:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleStartEdit = (circuit: DataCircuitRecord) => {
    setEditingId(circuit.id);
    setHandoffType(circuit.handoff_type || "");
    setEditData({
      provider: circuit.provider,
      location: circuit.location,
      circuit_id: circuit.circuit_id,
      alternate_cid: circuit.alternate_cid,
      carrier: circuit.carrier,
      account_number: circuit.account_number,
      security_code: circuit.security_code,
      circuit_type: circuit.circuit_type,
      line_speed: circuit.line_speed,
      port_speed: circuit.port_speed,
      handoff_type: circuit.handoff_type,
      fiber_type: circuit.fiber_type,
      connector_type: circuit.connector_type,
      quote_id: circuit.quote_id,
      contract_id: circuit.contract_id,
      foc_date: circuit.foc_date,
      ttu_date: circuit.ttu_date,
      notes: circuit.notes,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setHandoffType("");
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const result = await updateDataCircuit(id, {
        provider: typeof editData.provider === 'number' ? editData.provider : null,
        location: typeof editData.location === 'number' ? editData.location : null,
        circuit_id: editData.circuit_id?.trim() || null,
        alternate_cid: editData.alternate_cid?.trim() || null,
        carrier: editData.carrier?.trim() || null,
        account_number: editData.account_number?.trim() || null,
        security_code: editData.security_code?.trim() || null,
        circuit_type: editData.circuit_type || null,
        line_speed: editData.line_speed || null,
        port_speed: editData.port_speed?.trim() || null,
        handoff_type: editData.handoff_type || null,
        fiber_type: editData.fiber_type || null,
        connector_type: editData.connector_type || null,
        quote_id: editData.quote_id?.trim() || null,
        contract_id: editData.contract_id?.trim() || null,
        foc_date: editData.foc_date || null,
        ttu_date: editData.ttu_date || null,
        notes: editData.notes?.trim() || null,
      });

      if (result.success) {
        toast.success(result.message || "Data circuit updated successfully!");
        const circuitList = await listDataCircuits();
        setDataCircuits(Array.isArray(circuitList) ? circuitList : []);
        setEditingId(null);
        setEditData({});
        setHandoffType("");
      } else {
        toast.error(result.error || "Failed to update data circuit");
      }
    } catch (error) {
      console.error("Failed to update data circuit:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  useEffect(() => {
    async function fetchDataCircuits() {
      if (!session) {
        return;
      }

      try {
        const circuitList = await listDataCircuits();
        setDataCircuits(Array.isArray(circuitList) ? circuitList : []);
      } catch (error) {
        console.error("Failed to fetch data circuits:", error);
        if (error instanceof Error && error.message.includes("Authentication required")) {
          console.warn("Authentication required for data circuits");
        } else if (error instanceof Error && !error.message.includes("401")) {
          toast.error("Failed to load data circuits");
        }
        setDataCircuits([]);
      }
    }

    async function fetchLocations() {
      if (!session) {
        return;
      }

      try {
        const locationList = await listLocations();
        setLocations(Array.isArray(locationList) ? locationList : []);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        if (error instanceof Error && !error.message.includes("Authentication required")) {
          console.warn("Failed to load locations for dropdown");
        }
        setLocations([]);
      }
    }

    async function fetchProviders() {
      if (!session) {
        return;
      }

      try {
        const providerList = await listProviders();
        setProviders(Array.isArray(providerList) ? providerList : []);
      } catch (error) {
        console.error("Failed to fetch providers:", error);
        if (error instanceof Error && !error.message.includes("Authentication required")) {
          console.warn("Failed to load providers for dropdown");
        }
        setProviders([]);
      }
    }

    fetchDataCircuits();
    fetchLocations();
    fetchProviders();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Data Circuits</h1>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? "Cancel" : "Add Data Circuit"}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Add New Data Circuit
                </h2>
                <form ref={addFormRef} onSubmit={handleAddDataCircuit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="circuit_id" className="block text-sm font-medium mb-2">
                        Circuit ID
                      </label>
                      <input
                        id="circuit_id"
                        name="circuit_id"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Circuit ID"
                      />
                    </div>
                    <div>
                      <label htmlFor="alternate_cid" className="block text-sm font-medium mb-2">
                        Alternate CID
                      </label>
                      <input
                        id="alternate_cid"
                        name="alternate_cid"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Alternate CID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="provider" className="block text-sm font-medium mb-2">
                        Provider
                      </label>
                      <select
                        id="provider"
                        name="provider"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select a provider</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="carrier" className="block text-sm font-medium mb-2">
                        Carrier
                      </label>
                      <input
                        id="carrier"
                        name="carrier"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Carrier"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium mb-2">
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
                      <label htmlFor="account_number" className="block text-sm font-medium mb-2">
                        Account Number
                      </label>
                      <input
                        id="account_number"
                        name="account_number"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Account Number"
                      />
                    </div>
                    <div>
                      <label htmlFor="security_code" className="block text-sm font-medium mb-2">
                        Security Code
                      </label>
                      <input
                        id="security_code"
                        name="security_code"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Security Code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="circuit_type" className="block text-sm font-medium mb-2">
                        Type of Circuit
                      </label>
                      <select
                        id="circuit_type"
                        name="circuit_type"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select type</option>
                        <option value="broadband">Broadband</option>
                        <option value="dia">DIA</option>
                        <option value="satellite">Satellite</option>
                        <option value="lte_wireless">LTE Wireless</option>
                        <option value="ptp_wireless">PTP Wireless</option>
                        <option value="mpls">MPLS</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="line_speed" className="block text-sm font-medium mb-2">
                        Line Speed
                      </label>
                      <select
                        id="line_speed"
                        name="line_speed"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select speed</option>
                        <option value="10_mbps">10 Mb/s</option>
                        <option value="100_mbps">100 Mb/s</option>
                        <option value="1_gbps">1Gb/s</option>
                        <option value="10_gbps">10Gb/s</option>
                        <option value="100_gbps">100Gb/s</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="port_speed" className="block text-sm font-medium mb-2">
                        Port Speed
                      </label>
                      <input
                        id="port_speed"
                        name="port_speed"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Port Speed"
                      />
                    </div>
                    <div>
                      <label htmlFor="handoff_type" className="block text-sm font-medium mb-2">
                        Handoff
                      </label>
                      <select
                        id="handoff_type"
                        name="handoff_type"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={handoffType}
                        onChange={(e) => {
                          setHandoffType(e.target.value);
                          if (e.target.value !== "fiber") {
                            const form = e.target.closest("form");
                            if (form) {
                              const fiberType = form.querySelector("#fiber_type") as HTMLSelectElement;
                              const connectorType = form.querySelector("#connector_type") as HTMLSelectElement;
                              if (fiberType) fiberType.value = "";
                              if (connectorType) connectorType.value = "";
                            }
                          }
                        }}
                      >
                        <option value="">Select handoff type</option>
                        <option value="copper">Copper</option>
                        <option value="fiber">Fiber</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fiber_type" className="block text-sm font-medium mb-2">
                        Fiber Type
                      </label>
                      <select
                        id="fiber_type"
                        name="fiber_type"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        disabled={handoffType !== "fiber"}
                      >
                        <option value="">Select fiber type</option>
                        <option value="multimode">Multimode</option>
                        <option value="singlemode">Singlemode</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="connector_type" className="block text-sm font-medium mb-2">
                        Connector
                      </label>
                      <select
                        id="connector_type"
                        name="connector_type"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        disabled={handoffType !== "fiber"}
                      >
                        <option value="">Select connector</option>
                        <option value="st">ST</option>
                        <option value="sc">SC</option>
                        <option value="lc">LC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quote_id" className="block text-sm font-medium mb-2">
                        Quote ID
                      </label>
                      <input
                        id="quote_id"
                        name="quote_id"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Quote ID"
                      />
                    </div>
                    <div>
                      <label htmlFor="contract_id" className="block text-sm font-medium mb-2">
                        Contract ID
                      </label>
                      <input
                        id="contract_id"
                        name="contract_id"
                        type="text"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Contract ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="foc_date" className="block text-sm font-medium mb-2">
                        FOC Date
                      </label>
                      <input
                        id="foc_date"
                        name="foc_date"
                        type="date"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="ttu_date" className="block text-sm font-medium mb-2">
                        TTU Date
                      </label>
                      <input
                        id="ttu_date"
                        name="ttu_date"
                        type="date"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </div>
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
                      placeholder="Notes"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setHandoffType("");
                      }}
                      className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {submitting ? "Adding..." : "Add Data Circuit"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">
                Data Circuits
              </h2>
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                {dataCircuits.length > 0 ? (
                  <div className="divide-y divide-border">
                    {dataCircuits.map((circuit) => (
                      <div
                        key={circuit.id}
                        className="p-4 hover:bg-[oklch(0.98_0_0)]"
                      >
                        {editingId === circuit.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Circuit ID
                                </label>
                                <input
                                  type="text"
                                  value={editData.circuit_id || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, circuit_id: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Alternate CID
                                </label>
                                <input
                                  type="text"
                                  value={editData.alternate_cid || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, alternate_cid: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                            </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Provider
                                        </label>
                                        <select
                                          value={editData.provider || ""}
                                          onChange={(e) =>
                                            setEditData({ 
                                              ...editData, 
                                              provider: e.target.value ? parseInt(e.target.value, 10) : null 
                                            })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                          <option value="">Select a provider</option>
                                          {providers.map((provider) => (
                                            <option key={provider.id} value={provider.id}>
                                              {provider.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Carrier
                                        </label>
                                        <input
                                          type="text"
                                          value={editData.carrier || ""}
                                          onChange={(e) =>
                                            setEditData({ ...editData, carrier: e.target.value })
                                          }
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
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
                                  Circuit Type
                                </label>
                                <select
                                  value={editData.circuit_type || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, circuit_type: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="">Select type</option>
                                  <option value="broadband">Broadband</option>
                                  <option value="dia">DIA</option>
                                  <option value="satellite">Satellite</option>
                                  <option value="lte_wireless">LTE Wireless</option>
                                  <option value="ptp_wireless">PTP Wireless</option>
                                  <option value="mpls">MPLS</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Line Speed
                                </label>
                                <select
                                  value={editData.line_speed || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, line_speed: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="">Select speed</option>
                                  <option value="10_mbps">10 Mb/s</option>
                                  <option value="100_mbps">100 Mb/s</option>
                                  <option value="1_gbps">1Gb/s</option>
                                  <option value="10_gbps">10Gb/s</option>
                                  <option value="100_gbps">100Gb/s</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Port Speed
                                </label>
                                <input
                                  type="text"
                                  value={editData.port_speed || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, port_speed: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Handoff
                                </label>
                                <select
                                  value={handoffType}
                                  onChange={(e) => {
                                    setHandoffType(e.target.value);
                                    setEditData({ ...editData, handoff_type: e.target.value });
                                    if (e.target.value !== "fiber") {
                                      setEditData({ ...editData, handoff_type: e.target.value, fiber_type: null, connector_type: null });
                                    }
                                  }}
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="">Select handoff type</option>
                                  <option value="copper">Copper</option>
                                  <option value="fiber">Fiber</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Fiber Type
                                </label>
                                <select
                                  value={editData.fiber_type || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, fiber_type: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                  disabled={handoffType !== "fiber"}
                                >
                                  <option value="">Select fiber type</option>
                                  <option value="multimode">Multimode</option>
                                  <option value="singlemode">Singlemode</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Connector
                                </label>
                                <select
                                  value={editData.connector_type || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, connector_type: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                  disabled={handoffType !== "fiber"}
                                >
                                  <option value="">Select connector</option>
                                  <option value="st">ST</option>
                                  <option value="sc">SC</option>
                                  <option value="lc">LC</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Account Number
                                </label>
                                <input
                                  type="text"
                                  value={editData.account_number || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, account_number: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Security Code
                                </label>
                                <input
                                  type="text"
                                  value={editData.security_code || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, security_code: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Quote ID
                                </label>
                                <input
                                  type="text"
                                  value={editData.quote_id || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, quote_id: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Contract ID
                                </label>
                                <input
                                  type="text"
                                  value={editData.contract_id || ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, contract_id: e.target.value })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  FOC Date
                                </label>
                                <input
                                  type="date"
                                  value={editData.foc_date ? editData.foc_date.split('T')[0] : ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, foc_date: e.target.value || null })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  TTU Date
                                </label>
                                <input
                                  type="date"
                                  value={editData.ttu_date ? editData.ttu_date.split('T')[0] : ""}
                                  onChange={(e) =>
                                    setEditData({ ...editData, ttu_date: e.target.value || null })
                                  }
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Notes
                              </label>
                              <textarea
                                value={editData.notes || ""}
                                onChange={(e) =>
                                  setEditData({ ...editData, notes: e.target.value })
                                }
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(circuit.id)}
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
                                {circuit.circuit_id || circuit.alternate_cid || `Circuit #${circuit.id}`}
                              </h3>
                              <div className="text-xs text-muted-foreground space-y-1">
                                        {circuit.provider_name && (
                                          <p>
                                            <span className="font-medium">Provider:</span> {circuit.provider_name}
                                          </p>
                                        )}
                                        {circuit.carrier && (
                                          <p>
                                            <span className="font-medium">Carrier:</span> {circuit.carrier}
                                          </p>
                                        )}
                                        {circuit.location_name && (
                                          <p>
                                            <span className="font-medium">Location:</span> {circuit.location_name}
                                          </p>
                                        )}
                                {circuit.circuit_type_display && (
                                  <p>
                                    <span className="font-medium">Type:</span> {circuit.circuit_type_display}
                                  </p>
                                )}
                                {circuit.line_speed_display && (
                                  <p>
                                    <span className="font-medium">Line Speed:</span> {circuit.line_speed_display}
                                  </p>
                                )}
                                {circuit.port_speed && (
                                  <p>
                                    <span className="font-medium">Port Speed:</span> {circuit.port_speed}
                                  </p>
                                )}
                                {circuit.handoff_type_display && (
                                  <p>
                                    <span className="font-medium">Handoff:</span> {circuit.handoff_type_display}
                                    {circuit.fiber_type_display && ` (${circuit.fiber_type_display})`}
                                    {circuit.connector_type_display && ` - ${circuit.connector_type_display}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleStartEdit(circuit)}
                                className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDataCircuit(circuit.id)}
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
                    No data circuits found
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

