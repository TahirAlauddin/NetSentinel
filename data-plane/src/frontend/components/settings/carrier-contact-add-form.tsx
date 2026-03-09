import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { CarrierContactCreateDto } from "@/types/carrier-contacts";
import { LocationRecord } from "@/types/locations";

interface CarrierContactAddFormProps {
  locations: LocationRecord[];
  onSubmit: (data: CarrierContactCreateDto) => Promise<boolean>;
  onCancel: () => void;
}

export function CarrierContactAddForm({ locations, onSubmit, onCancel }: CarrierContactAddFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const success = await onSubmit(data);
      if (success && formRef.current) {
        formRef.current.reset();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Add New Carrier Contact</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Carrier name"
            />
          </div>
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
            <label htmlFor="customer_service_phone" className="block text-sm font-medium mb-2">
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
            <label htmlFor="technical_support_phone" className="block text-sm font-medium mb-2">
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
            <label htmlFor="sales_phone" className="block text-sm font-medium mb-2">
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
            <label htmlFor="billing_phone" className="block text-sm font-medium mb-2">
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
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? "Adding..." : "Add Carrier Contact"}
          </button>
        </div>
      </form>
    </div>
  );
}