"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { IPRequestCreateDto } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { Subnet } from "@/types/ipam";

const ipamApi = new IpamApiClient();

interface IPRequestFormProps {
  subnetId?: number;
  subnetNetwork?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IPRequestCreateDto) => Promise<void>;
  loading?: boolean;
}

export function IPRequestForm({
  subnetId = 0,
  subnetNetwork,
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: IPRequestFormProps) {
  const [formData, setFormData] = useState<IPRequestCreateDto>({
    subnet: subnetId || 0,
    requested_ip: null,
    purpose: "",
    description: "",
    reservation_expires_at: null,
  });
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loadingSubnets, setLoadingSubnets] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const showSubnetSelector = !subnetId || subnetId === 0;

  useEffect(() => {
    if (subnetId) {
      setFormData((prev) => ({ ...prev, subnet: subnetId }));
    }
  }, [subnetId]);

  useEffect(() => {
    if (open && showSubnetSelector) {
      loadSubnets();
    }
  }, [open, showSubnetSelector]);

  const loadSubnets = async () => {
    setLoadingSubnets(true);
    try {
      const response = await ipamApi.getSubnets();
      if (response.error) {
        throw new Error(response.error);
      }
      setSubnets(extractIpamArrayData<Subnet>(response.data));
    } catch (error) {
      console.error("Error loading subnets:", error);
    } finally {
      setLoadingSubnets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.subnet || formData.subnet === 0) {
      setErrors({ subnet: "Subnet is required" });
      return;
    }
    if (!formData.purpose.trim()) {
      setErrors({ purpose: "Purpose is required" });
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        subnet: subnetId,
        requested_ip: null,
        purpose: "",
        description: "",
        reservation_expires_at: null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting IP request:", error);
    }
  };

  const handleChange = (field: keyof IPRequestCreateDto, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request IP Address</DialogTitle>
          <DialogDescription>
            {subnetNetwork
              ? `Request an IP address from subnet ${subnetNetwork}`
              : "Request an IP address reservation"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showSubnetSelector && (
            <div className="space-y-2">
              <Label htmlFor="subnet">
                Subnet <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.subnet?.toString() || ""}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, subnet: parseInt(value) }));
                  if (errors.subnet) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.subnet;
                      return newErrors;
                    });
                  }
                }}
                disabled={loadingSubnets}
              >
                <SelectTrigger className={errors.subnet ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a subnet" />
                </SelectTrigger>
                <SelectContent>
                  {subnets.map((subnet) => (
                    <SelectItem key={subnet.id} value={subnet.id.toString()}>
                      {subnet.network} {subnet.description ? `- ${subnet.description}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subnet && <p className="text-sm text-destructive">{errors.subnet}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requested_ip">
              Requested IP Address <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="requested_ip"
              type="text"
              placeholder="Leave blank for auto-assignment"
              value={formData.requested_ip || ""}
              onChange={(e) => handleChange("requested_ip", e.target.value || null)}
              className={errors.requested_ip ? "border-destructive" : ""}
            />
            {errors.requested_ip && (
              <p className="text-sm text-destructive">{errors.requested_ip}</p>
            )}
            <p className="text-xs text-muted-foreground">
              If left blank, the next available IP will be assigned automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">
              Purpose <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="purpose"
              placeholder="Describe the purpose for this IP address reservation..."
              value={formData.purpose}
              onChange={(e) => handleChange("purpose", e.target.value)}
              required
              rows={3}
              className={errors.purpose ? "border-destructive" : ""}
            />
            {errors.purpose && <p className="text-sm text-destructive">{errors.purpose}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Any additional notes or information..."
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value || null)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservation_expires_at">
              Reservation Expires At <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="reservation_expires_at"
              type="datetime-local"
              value={
                formData.reservation_expires_at
                  ? new Date(formData.reservation_expires_at).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                handleChange("reservation_expires_at", e.target.value ? e.target.value : null)
              }
            />
            <p className="text-xs text-muted-foreground">
              Set an expiration date for this reservation (optional).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
