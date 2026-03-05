"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFormString, getFormStringOrNull, getFormNumberOrNull } from "@/lib/form-utils";
import type { ServiceRecord, ServiceCreateDto } from "@/types/services";
import type { ProviderRecord } from "@/types/providers";
import type { LocationRecord } from "@/types/locations";

interface ServiceFormProps {
  defaultValues?: Partial<ServiceRecord>;
  providers: ProviderRecord[];
  locations: LocationRecord[];
  onSubmit: (data: ServiceCreateDto) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const data: ServiceCreateDto = {
      name: getFormString(fd, "name"),
      provider: getFormNumberOrNull(fd, "provider"),
      location: getFormNumberOrNull(fd, "location"),
      service_category: getFormStringOrNull(fd, "service_category") ?? null,
      service_type: getFormStringOrNull(fd, "service_type") ?? null,
      associated_product: getFormStringOrNull(fd, "associated_product"),
      account_number: getFormStringOrNull(fd, "account_number"),
      security_code: getFormStringOrNull(fd, "security_code"),
      contract_id: getFormStringOrNull(fd, "contract_id"),
      monthly_cost: getFormStringOrNull(fd, "monthly_cost"),
      notes: getFormStringOrNull(fd, "notes"),
    };
    await onSubmit(data);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Service name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. DevOps Main Data"
          defaultValue={defaultValues?.name ?? undefined}
          required
        />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service_category">Service category</Label>
          <select
            id="service_category"
            name="service_category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.service_category ?? ""}
          >
            <option value="">Select category</option>
            <option value="data">Data</option>
            <option value="voice">Voice</option>
            <option value="internet">Internet</option>
            <option value="mobile">Mobile</option>
            <option value="consolidated">Consolidated</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_type">Service type</Label>
          <select
            id="service_type"
            name="service_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.service_type ?? ""}
          >
            <option value="">Select type</option>
            <option value="broadband">Broadband</option>
            <option value="dia">DIA</option>
            <option value="satellite">Satellite</option>
            <option value="lte_wireless">LTE Wireless</option>
            <option value="ptp_wireless">PTP Wireless</option>
            <option value="mpls">MPLS</option>
            <option value="pri">PRI</option>
            <option value="sip">SIP</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="associated_product">Associated product</Label>
          <Input
            id="associated_product"
            name="associated_product"
            placeholder="Product name"
            defaultValue={defaultValues?.associated_product ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_cost">Monthly cost</Label>
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
          <Label htmlFor="account_number">Account number</Label>
          <Input
            id="account_number"
            name="account_number"
            placeholder="Account number"
            defaultValue={defaultValues?.account_number ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="security_code">Pin</Label>
          <Input
            id="security_code"
            name="security_code"
            placeholder="Pin / security code"
            defaultValue={defaultValues?.security_code ?? undefined}
          />
        </div>
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
