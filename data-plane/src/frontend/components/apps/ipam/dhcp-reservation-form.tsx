"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DHCPReservation, DHCPScope } from "@/types/ipam";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface DhcpReservationFormProps {
  reservation?: DHCPReservation;
  onSubmit: (data: Partial<DHCPReservation>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DhcpReservationForm({
  reservation,
  onSubmit,
  onCancel,
  loading,
}: DhcpReservationFormProps) {
  const [scope, setScope] = useState(reservation?.scope?.toString() || "");
  const [ipAddress, setIpAddress] = useState(reservation?.ip_address || "");
  const [macAddress, setMacAddress] = useState(reservation?.mac_address || "");
  const [hostname, setHostname] = useState(reservation?.hostname || "");
  const [description, setDescription] = useState(reservation?.description || "");
  const [isActive, setIsActive] = useState(reservation?.is_active ?? true);
  const [scopes, setScopes] = useState<DHCPScope[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScopes = async () => {
      try {
        const res = await api.get("/ipam/dhcp-scopes/");
        if (res.data) {
          const scopesData = extractIpamArrayData(res.data);
          setScopes(scopesData as DHCPScope[]);
        }
      } catch (err) {
        console.error("Error loading DHCP scopes:", err);
      }
    };
    loadScopes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        scope: parseInt(scope),
        ip_address: ipAddress,
        mac_address: macAddress,
        hostname: hostname || null,
        description: description || null,
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save DHCP reservation");
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="scope">DHCP Scope *</Label>
            <Select value={scope} onValueChange={setScope} required>
              <SelectTrigger>
                <SelectValue placeholder="Select DHCP scope" />
              </SelectTrigger>
              <SelectContent>
                {scopes.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} - {s.subnet_detail?.network || s.subnet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip_address">IP Address *</Label>
            <Input
              id="ip_address"
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mac_address">MAC Address *</Label>
            <Input
              id="mac_address"
              type="text"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="00:11:22:33:44:55"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">Hostname</Label>
            <Input
              id="hostname"
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="Optional hostname"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
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
            {loading ? "Saving..." : reservation ? "Update Reservation" : "Create Reservation"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
