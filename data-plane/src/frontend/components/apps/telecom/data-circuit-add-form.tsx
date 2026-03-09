"use client";

import { useState, useRef } from "react";
import { DataCircuitCreateDto } from "@/types/data-circuits";
import { Button } from "@/components/ui/button";

interface ProviderOption {
  id: number;
  name: string;
}

interface LocationOption {
  id: number;
  name: string;
  city?: string | null;
}

interface DataCircuitAddFormProps {
  providers: ProviderOption[];
  locations: LocationOption[];
  submitting: boolean;
  onSubmit: (data: DataCircuitCreateDto) => Promise<boolean>;
  onCancel: () => void;
}

export function DataCircuitAddForm({
  providers,
  locations,
  submitting,
  onSubmit,
  onCancel,
}: DataCircuitAddFormProps) {
  const [handoffType, setHandoffType] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

    const success = await onSubmit(data);
    if (success && formRef.current) {
      formRef.current.reset();
      setHandoffType("");
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Add New Data Circuit</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCancel();
              setHandoffType("");
              formRef.current?.reset();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="bg-red-500 hover:bg-red-600 text-white">
            {submitting ? "Adding..." : "Add Data Circuit"}
          </Button>
        </div>
      </form>
    </div>
  );
}