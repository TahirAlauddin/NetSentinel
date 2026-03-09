"use client";

import { useState } from "react";
import { DataCircuitCreateDto, DataCircuitRecord } from "@/types/data-circuits";
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

interface DataCircuitEditRowProps {
  circuit: DataCircuitRecord;
  providers: ProviderOption[];
  locations: LocationOption[];
  onSave: (id: number, data: DataCircuitCreateDto) => Promise<boolean>;
  onCancel: () => void;
}

export function DataCircuitEditRow({
  circuit,
  providers,
  locations,
  onSave,
  onCancel,
}: DataCircuitEditRowProps) {
  const [handoffType, setHandoffType] = useState<string>(circuit.handoff_type || "");
  const [editData, setEditData] = useState<Partial<DataCircuitRecord>>({
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

  const handleSave = async () => {
    const payload: DataCircuitCreateDto = {
      provider: typeof editData.provider === "number" ? editData.provider : null,
      location: typeof editData.location === "number" ? editData.location : null,
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
    };
    await onSave(circuit.id, payload);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Circuit ID</label>
          <input
            type="text"
            value={editData.circuit_id || ""}
            onChange={(e) => setEditData({ ...editData, circuit_id: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Alternate CID</label>
          <input
            type="text"
            value={editData.alternate_cid || ""}
            onChange={(e) => setEditData({ ...editData, alternate_cid: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <select
            value={editData.provider || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                provider: e.target.value ? parseInt(e.target.value, 10) : null,
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
          <label className="block text-sm font-medium mb-2">Carrier</label>
          <input
            type="text"
            value={editData.carrier || ""}
            onChange={(e) => setEditData({ ...editData, carrier: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <select
            value={editData.location || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                location: e.target.value ? parseInt(e.target.value, 10) : null,
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
          <label className="block text-sm font-medium mb-2">Circuit Type</label>
          <select
            value={editData.circuit_type || ""}
            onChange={(e) => setEditData({ ...editData, circuit_type: e.target.value })}
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
          <label className="block text-sm font-medium mb-2">Line Speed</label>
          <select
            value={editData.line_speed || ""}
            onChange={(e) => setEditData({ ...editData, line_speed: e.target.value })}
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
          <label className="block text-sm font-medium mb-2">Port Speed</label>
          <input
            type="text"
            value={editData.port_speed || ""}
            onChange={(e) => setEditData({ ...editData, port_speed: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Handoff</label>
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
          <label className="block text-sm font-medium mb-2">Fiber Type</label>
          <select
            value={editData.fiber_type || ""}
            onChange={(e) => setEditData({ ...editData, fiber_type: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            disabled={handoffType !== "fiber"}
          >
            <option value="">Select fiber type</option>
            <option value="multimode">Multimode</option>
            <option value="singlemode">Singlemode</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Connector</label>
          <select
            value={editData.connector_type || ""}
            onChange={(e) => setEditData({ ...editData, connector_type: e.target.value })}
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
          <label className="block text-sm font-medium mb-2">Account Number</label>
          <input
            type="text"
            value={editData.account_number || ""}
            onChange={(e) => setEditData({ ...editData, account_number: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Security Code</label>
          <input
            type="text"
            value={editData.security_code || ""}
            onChange={(e) => setEditData({ ...editData, security_code: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Quote ID</label>
          <input
            type="text"
            value={editData.quote_id || ""}
            onChange={(e) => setEditData({ ...editData, quote_id: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Contract ID</label>
          <input
            type="text"
            value={editData.contract_id || ""}
            onChange={(e) => setEditData({ ...editData, contract_id: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">FOC Date</label>
          <input
            type="date"
            value={editData.foc_date ? editData.foc_date.split('T')[0] : ""}
            onChange={(e) => setEditData({ ...editData, foc_date: e.target.value || null })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">TTU Date</label>
          <input
            type="date"
            value={editData.ttu_date ? editData.ttu_date.split('T')[0] : ""}
            onChange={(e) => setEditData({ ...editData, ttu_date: e.target.value || null })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea
          value={editData.notes || ""}
          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          Save
        </Button>
      </div>
    </div>
  );
}