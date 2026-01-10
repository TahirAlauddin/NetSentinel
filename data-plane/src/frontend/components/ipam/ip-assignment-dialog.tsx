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
import { api } from "@/lib/utils";
import type { IPAddress } from "@/types/ipam";
import type { IPAssignDto } from "@/types/ipam/dto";

interface IPAssignmentDialogProps {
  ipAddress: IPAddress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode: "assign" | "release";
}

export function IPAssignmentDialog({
  ipAddress,
  open,
  onOpenChange,
  onSuccess,
  mode,
}: IPAssignmentDialogProps) {
  const [assets, setAssets] = useState<Array<{ id: number; name: string; asset_tag?: string | null }>>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && mode === "assign") {
      loadAssets();
    }
  }, [open, mode]);

  const loadAssets = async () => {
    try {
      const response = await api.get("/assets/");
      if (response.data && Array.isArray(response.data.results || response.data)) {
        const assetsData = response.data.results || response.data;
        setAssets(assetsData);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ipamApi = (await import("@/lib/api-client/ipam")).IpamApiClient;
      const apiClient = new ipamApi();

      if (mode === "assign") {
        if (!selectedAsset) {
          throw new Error("Please select an asset");
        }
        const data: IPAssignDto = {
          asset_id: parseInt(selectedAsset),
          reason: reason || undefined,
          notes: notes || undefined,
        };
        const response = await apiClient.assignIPAddress(ipAddress.id, data);
        if (response.error) {
          throw new Error(response.error);
        }
      } else {
        const response = await apiClient.releaseIPAddress(ipAddress.id, {
          reason: reason || undefined,
          notes: notes || undefined,
        });
        if (response.error) {
          throw new Error(response.error);
        }
      }

      onSuccess();
      onOpenChange(false);
      setSelectedAsset("");
      setReason("");
      setNotes("");
    } catch (error) {
      console.error(`Error ${mode === "assign" ? "assigning" : "releasing"} IP:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${mode} IP address`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "assign" ? "Assign IP Address" : "Release IP Address"}
          </DialogTitle>
          <DialogDescription>
            {mode === "assign"
              ? `Assign ${ipAddress.address} to an asset/device`
              : `Release ${ipAddress.address} from its current assignment`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "assign" && (
            <div className="space-y-2">
              <Label htmlFor="asset">
                Asset/Device <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id.toString()}>
                      {asset.name} {asset.asset_tag && `(${asset.asset_tag})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder={`Reason for ${mode === "assign" ? "assignment" : "release"}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? `${mode === "assign" ? "Assigning" : "Releasing"}...`
                : mode === "assign"
                  ? "Assign IP"
                  : "Release IP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
