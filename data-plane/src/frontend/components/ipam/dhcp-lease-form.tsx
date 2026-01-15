"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DHCPScope } from "@/types/ipam";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface DhcpLeaseFormProps {
  onSubmit: (data: {
    scope: number;
    ip_address: string;
    mac_address: string;
    hostname?: string;
    lease_duration?: number;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DhcpLeaseForm({ onSubmit, onCancel, loading }: DhcpLeaseFormProps) {
  const [scope, setScope] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [hostname, setHostname] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("24");
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
        hostname: hostname || undefined,
        lease_duration: parseInt(leaseDuration) * 3600, // Convert hours to seconds
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create DHCP lease");
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

          <div className="space-y-2">
            <Label htmlFor="lease_duration">Lease Duration (hours) *</Label>
            <Input
              id="lease_duration"
              type="number"
              min="1"
              value={leaseDuration}
              onChange={(e) => setLeaseDuration(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Lease"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
