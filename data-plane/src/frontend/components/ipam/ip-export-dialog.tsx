"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Download, Loader2 } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { toast } from "sonner";
import type { Subnet } from "@/types/ipam";

const ipamApi = new IpamApiClient();

interface IPExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubnetId?: number;
}

export function IPExportDialog({
  open,
  onOpenChange,
  defaultSubnetId,
}: IPExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [status, setStatus] = useState<string>("");
  const [subnetId, setSubnetId] = useState<string>(
    defaultSubnetId?.toString() || ""
  );
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loadingSubnets, setLoadingSubnets] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) {
      loadSubnets();
      if (defaultSubnetId) {
        setSubnetId(defaultSubnetId.toString());
      }
    }
  }, [open, defaultSubnetId]);

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
      toast.error("Failed to load subnets");
    } finally {
      setLoadingSubnets(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const filters: {
        status?: string;
        subnet?: number | string;
      } = {};

      if (status) {
        filters.status = status;
      }

      if (subnetId) {
        filters.subnet = parseInt(subnetId);
      }

      const blob = await ipamApi.exportIPAddresses(format, filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ip_addresses_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`IP addresses exported successfully as ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to export IP addresses"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export IP Addresses</DialogTitle>
          <DialogDescription>
            Export IP addresses to CSV or JSON format. You can filter by status
            and subnet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(value: "csv" | "json") => setFormat(value)}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma-separated values)</SelectItem>
                <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status (optional)</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="dhcp">DHCP</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subnet Filter */}
          <div className="space-y-2">
            <Label htmlFor="subnet">Subnet (optional)</Label>
            <Select
              value={subnetId}
              onValueChange={setSubnetId}
              disabled={loadingSubnets}
            >
              <SelectTrigger id="subnet">
                <SelectValue placeholder="All subnets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All subnets</SelectItem>
                {subnets.map((subnet) => (
                  <SelectItem key={subnet.id} value={subnet.id.toString()}>
                    {subnet.network} {subnet.description ? `- ${subnet.description}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
