"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhoneNumberRange } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { toast } from "sonner";

const ipamApi = new IpamApiClient();

interface PhoneNumberFormProps {
  phoneNumber?: PhoneNumberRange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Location {
  id: number;
  name: string;
}

export function PhoneNumberForm({
  phoneNumber,
  open,
  onOpenChange,
  onSuccess,
}: PhoneNumberFormProps) {
  const [formData, setFormData] = useState({
    location: "",
    carrier: "",
    trunk: "",
    start_number: "",
    stop_number: "",
    notes: "",
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [_loadingLocations, setLoadingLocations] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadLocations();
      if (phoneNumber) {
        setFormData({
          location: phoneNumber.location?.toString() || "",
          carrier: phoneNumber.carrier || "",
          trunk: phoneNumber.trunk || "",
          start_number: phoneNumber.start_number,
          stop_number: phoneNumber.stop_number,
          notes: phoneNumber.notes || "",
        });
      } else {
        setFormData({
          location: "",
          carrier: "",
          trunk: "",
          start_number: "",
          stop_number: "",
          notes: "",
        });
      }
      setErrors({});
    }
  }, [open, phoneNumber]);

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await fetch("/api/v1/infrastructure/locations/", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(extractIpamArrayData(data));
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.start_number.trim()) {
      newErrors.start_number = "Start number is required";
    }
    if (!formData.stop_number.trim()) {
      newErrors.stop_number = "Stop number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        location: formData.location ? parseInt(formData.location) : null,
        carrier: formData.carrier || null,
        trunk: formData.trunk || null,
        start_number: formData.start_number.trim(),
        stop_number: formData.stop_number.trim(),
        notes: formData.notes || null,
      };

      if (phoneNumber) {
        await ipamApi.updatePhoneNumberRange(phoneNumber.id, payload);
        toast.success("Phone number range updated successfully");
      } else {
        await ipamApi.createPhoneNumberRange(payload);
        toast.success("Phone number range created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error saving phone number range:", error);
      let errorMessage = "Failed to save phone number range";
      
      if (error && typeof error === "object") {
        const err = error as { response?: { data?: { error?: string; [key: string]: unknown } }; message?: string };
        errorMessage = err?.response?.data?.error || err?.message || errorMessage;
        
        // Set field-specific errors if available
        if (err?.response?.data) {
          const fieldErrors: Record<string, string> = {};
          Object.keys(err.response.data).forEach((key) => {
            if (key !== "error") {
              const value = err.response.data![key];
              if (Array.isArray(value)) {
                fieldErrors[key] = String(value[0]);
              } else if (value) {
                fieldErrors[key] = String(value);
              }
            }
          });
          setErrors(fieldErrors);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {phoneNumber ? "Edit Phone Number Range" : "Add Phone Number Range"}
          </DialogTitle>
          <DialogDescription>
            {phoneNumber
              ? "Update the phone number range information"
              : "Create a new phone number range with carrier, trunk, and location information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_number">
                Start Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_number"
                value={formData.start_number}
                onChange={(e) =>
                  setFormData({ ...formData, start_number: e.target.value })
                }
                placeholder="e.g., +1-555-0100"
                required
              />
              {errors.start_number && (
                <p className="text-sm text-red-500">{errors.start_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stop_number">
                Stop Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stop_number"
                value={formData.stop_number}
                onChange={(e) =>
                  setFormData({ ...formData, stop_number: e.target.value })
                }
                placeholder="e.g., +1-555-0199"
                required
              />
              {errors.stop_number && (
                <p className="text-sm text-red-500">{errors.stop_number}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) =>
                  setFormData({ ...formData, location: value })
                }
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                value={formData.carrier}
                onChange={(e) =>
                  setFormData({ ...formData, carrier: e.target.value })
                }
                placeholder="e.g., Verizon, AT&T"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trunk">Trunk</Label>
            <Input
              id="trunk"
              value={formData.trunk}
              onChange={(e) =>
                setFormData({ ...formData, trunk: e.target.value })
              }
              placeholder="Trunk identifier"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this phone number range"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? phoneNumber
                  ? "Updating..."
                  : "Creating..."
                : phoneNumber
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
