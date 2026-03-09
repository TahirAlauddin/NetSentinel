import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { CarrierContactRecord, CarrierContactCreateDto } from "@/types/carrier-contacts";
import { LocationRecord } from "@/types/locations";
import { toast } from "sonner";

interface CarrierContactItemProps {
  contact: CarrierContactRecord;
  locations: LocationRecord[];
  onUpdate: (id: number, data: CarrierContactCreateDto) => Promise<boolean>;
  onDelete: (id: number) => Promise<void>;
}

export function CarrierContactItem({ contact, locations, onUpdate, onDelete }: CarrierContactItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CarrierContactRecord>>({});

  const handleStartEdit = () => {
    setIsEditing(true);
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
    setIsEditing(false);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!editData.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    const payload: CarrierContactCreateDto = {
      name: editData.name?.trim() || "",
      location: typeof editData.location === 'number' ? editData.location : null,
      customer_service_phone: editData.customer_service_phone?.trim() || null,
      technical_support_phone: editData.technical_support_phone?.trim() || null,
      sales_phone: editData.sales_phone?.trim() || null,
      billing_phone: editData.billing_phone?.trim() || null,
    };

    const success = await onUpdate(contact.id, payload);
    if (success) {
      setIsEditing(false);
      setEditData({});
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editData.name || ""}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              autoFocus
            />
          </div>
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
            <label className="block text-sm font-medium mb-2">Customer Service Phone</label>
            <input
              type="tel"
              value={editData.customer_service_phone || ""}
              onChange={(e) =>
                setEditData({ ...editData, customer_service_phone: e.target.value })
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Technical Support Phone</label>
            <input
              type="tel"
              value={editData.technical_support_phone || ""}
              onChange={(e) =>
                setEditData({ ...editData, technical_support_phone: e.target.value })
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sales Phone</label>
            <input
              type="tel"
              value={editData.sales_phone || ""}
              onChange={(e) => setEditData({ ...editData, sales_phone: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Billing Phone</label>
            <input
              type="tel"
              value={editData.billing_phone || ""}
              onChange={(e) => setEditData({ ...editData, billing_phone: e.target.value })}
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
            onClick={handleSaveEdit}
            className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[oklch(0.40_0.15_249)] mb-2">
          {contact.name}
        </h3>
        <div className="text-xs text-muted-foreground space-y-1">
          {contact.location_name && (
            <p>
              <span className="font-medium">Location:</span> {contact.location_name}
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
                <span className="font-medium">Sales:</span> {contact.sales_phone}
              </p>
            )}
            {contact.billing_phone && (
              <p>
                <span className="font-medium">Billing:</span> {contact.billing_phone}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={handleStartEdit}
          className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}