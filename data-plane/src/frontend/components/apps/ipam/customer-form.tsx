"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Customer } from "@/types/ipam";
import { CustomerCreateUpdateDto } from "@/types/ipam/dto";

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerCreateUpdateDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, loading }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [description, setDescription] = useState(customer?.description || "");
  const [contactEmail, setContactEmail] = useState(customer?.contact_email || "");
  const [contactPhone, setContactPhone] = useState(customer?.contact_phone || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        name,
        description: description || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

