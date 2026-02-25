"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProviderRecord, ProviderCreateDto } from "@/types/providers";

interface ProviderFormProps {
  defaultValues?: Partial<ProviderRecord>;
  onSubmit: (data: ProviderCreateDto) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
  isSubmitting?: boolean;
}

export function ProviderForm({
  defaultValues,
  onSubmit,
  submitLabel,
  cancelHref,
  isSubmitting = false,
}: ProviderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const data: ProviderCreateDto = {
      name: (fd.get("name") as string)?.trim() || "",
      description: (fd.get("description") as string)?.trim() || null,
      service_type: (fd.get("service_type") as string) || null,
      status: (fd.get("status") as string) || "active",
      account_number: (fd.get("account_number") as string)?.trim() || null,
      contact_name: (fd.get("contact_name") as string)?.trim() || null,
      contact_email: (fd.get("contact_email") as string)?.trim() || null,
      contact_phone: (fd.get("contact_phone") as string)?.trim() || null,
      website: (fd.get("website") as string)?.trim() || null,
      logo_url: (fd.get("logo_url") as string)?.trim() || null,
      monthly_cost: (fd.get("monthly_cost") as string)?.trim() || null,
      notes: (fd.get("notes") as string)?.trim() || null,
    };
    await onSubmit(data);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Provider name"
            defaultValue={defaultValues?.name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_type">Service Type</Label>
          <select
            id="service_type"
            name="service_type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.service_type ?? ""}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={defaultValues?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_number">Account Number</Label>
          <Input
            id="account_number"
            name="account_number"
            placeholder="Account number"
            defaultValue={defaultValues?.account_number ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input
            id="contact_name"
            name="contact_name"
            placeholder="Contact name"
            defaultValue={defaultValues?.contact_name ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="contact@example.com"
            defaultValue={defaultValues?.contact_email ?? undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            placeholder="(555) 123-4567"
            defaultValue={defaultValues?.contact_phone ?? undefined}
          />
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
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://example.com"
            defaultValue={defaultValues?.website ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            defaultValue={defaultValues?.logo_url ?? undefined}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Provider description"
          defaultValue={defaultValues?.description ?? undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Additional notes"
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
