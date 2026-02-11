"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DataCircuitRecord, DataCircuitCreateDto } from "@/types/data-circuits";
import type { ProviderRecord } from "@/types/providers";
import type { LocationRecord } from "@/types/locations";

interface ServiceFormProps {
  defaultValues?: Partial<DataCircuitRecord>;
  providers: ProviderRecord[];
  locations: LocationRecord[];
  onSubmit: (data: DataCircuitCreateDto) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
  isSubmitting?: boolean;
}

export function ServiceForm({
  defaultValues,
  providers,
  locations,
  onSubmit,
  submitLabel,
  cancelHref,
  isSubmitting = false,
}: ServiceFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [handoffType, setHandoffType] = useState(defaultValues?.handoff_type ?? "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const providerVal = (fd.get("provider") as string)?.trim();
    const locationVal = (fd.get("location") as string)?.trim();
    const data: DataCircuitCreateDto = {
      provider: providerVal ? parseInt(providerVal, 10) : null,
      location: locationVal ? parseInt(locationVal, 10) : null,
      circuit_id: (fd.get("circuit_id") as string)?.trim() || null,
      alternate_cid: (fd.get("alternate_cid") as string)?.trim() || null,
      carrier: (fd.get("carrier") as string)?.trim() || null,
      account_number: (fd.get("account_number") as string)?.trim() || null,
      security_code: (fd.get("security_code") as string)?.trim() || null,
      circuit_type: (fd.get("circuit_type") as string) || null,
      line_speed: (fd.get("line_speed") as string) || null,
      port_speed: (fd.get("port_speed") as string)?.trim() || null,
      handoff_type: (fd.get("handoff_type") as string) || null,
      fiber_type: (fd.get("fiber_type") as string) || null,
      connector_type: (fd.get("connector_type") as string) || null,
      quote_id: (fd.get("quote_id") as string)?.trim() || null,
      contract_id: (fd.get("contract_id") as string)?.trim() || null,
      foc_date: (fd.get("foc_date") as string) || null,
      ttu_date: (fd.get("ttu_date") as string) || null,
      monthly_cost: (fd.get("monthly_cost") as string)?.trim() || null,
      notes: (fd.get("notes") as string)?.trim() || null,
    };
    await onSubmit(data);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="circuit_id">Circuit ID</Label>
          <Input
            id="circuit_id"
            name="circuit_id"
            placeholder="Circuit ID"
            defaultValue={defaultValues?.circuit_id ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alternate_cid">Alternate CID</Label>
          <Input
            id="alternate_cid"
            name="alternate_cid"
            placeholder="Alternate CID"
            defaultValue={defaultValues?.alternate_cid ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <select
            id="provider"
            name="provider"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.provider ?? ""}
          >
            <option value="">Select a provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="carrier">Carrier</Label>
          <Input
            id="carrier"
            name="carrier"
            placeholder="Carrier"
            defaultValue={defaultValues?.carrier ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <select
            id="location"
            name="location"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.location ?? ""}
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.city ? `- ${loc.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_cost">Monthly Cost</Label>
          <Input
            id="monthly_cost"
            name="monthly_cost"
            type="number"
            step="0.01"
            placeholder="0.00"
            defaultValue={defaultValues?.monthly_cost ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_number">Account Number</Label>
          <Input
            id="account_number"
            name="account_number"
            placeholder="Account Number"
            defaultValue={defaultValues?.account_number ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="security_code">Security Code / Pin</Label>
          <Input
            id="security_code"
            name="security_code"
            placeholder="Security Code"
            defaultValue={defaultValues?.security_code ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="circuit_type">Circuit Type</Label>
          <select
            id="circuit_type"
            name="circuit_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.circuit_type ?? ""}
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
        <div className="space-y-2">
          <Label htmlFor="line_speed">Line Speed</Label>
          <select
            id="line_speed"
            name="line_speed"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.line_speed ?? ""}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="port_speed">Port Speed</Label>
          <Input
            id="port_speed"
            name="port_speed"
            placeholder="Port Speed"
            defaultValue={defaultValues?.port_speed ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handoff_type">Handoff Type</Label>
          <select
            id="handoff_type"
            name="handoff_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={handoffType}
            onChange={(e) => setHandoffType(e.target.value)}
          >
            <option value="">Select handoff type</option>
            <option value="copper">Copper</option>
            <option value="fiber">Fiber</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fiber_type">Fiber Type</Label>
          <select
            id="fiber_type"
            name="fiber_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            defaultValue={defaultValues?.fiber_type ?? ""}
            disabled={handoffType !== "fiber"}
          >
            <option value="">Select fiber type</option>
            <option value="multimode">Multimode</option>
            <option value="singlemode">Singlemode</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="connector_type">Connector Type</Label>
          <select
            id="connector_type"
            name="connector_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            defaultValue={defaultValues?.connector_type ?? ""}
            disabled={handoffType !== "fiber"}
          >
            <option value="">Select connector</option>
            <option value="st">ST</option>
            <option value="sc">SC</option>
            <option value="lc">LC</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quote_id">Quote ID</Label>
          <Input
            id="quote_id"
            name="quote_id"
            placeholder="Quote ID"
            defaultValue={defaultValues?.quote_id ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_id">Contract ID</Label>
          <Input
            id="contract_id"
            name="contract_id"
            placeholder="Contract ID"
            defaultValue={defaultValues?.contract_id ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="foc_date">FOC Date</Label>
          <Input
            id="foc_date"
            name="foc_date"
            type="date"
            defaultValue={defaultValues?.foc_date ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ttu_date">TTU Date</Label>
          <Input
            id="ttu_date"
            name="ttu_date"
            type="date"
            defaultValue={defaultValues?.ttu_date ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Notes"
          defaultValue={defaultValues?.notes ?? undefined}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
