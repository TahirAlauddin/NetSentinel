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
import { DHCPScope } from "@/types/ipam";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { Subnet } from "@/types/ipam";

interface DhcpScopeFormProps {
  scope?: DHCPScope;
  onSubmit: (data: Partial<DHCPScope>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DhcpScopeForm({ scope, onSubmit, onCancel, loading }: DhcpScopeFormProps) {
  const [subnet, setSubnet] = useState(scope?.subnet?.toString() || "");
  const [name, setName] = useState(scope?.name || "");
  const [description, setDescription] = useState(scope?.description || "");
  const [startIp, setStartIp] = useState(scope?.start_ip || "");
  const [endIp, setEndIp] = useState(scope?.end_ip || "");
  const [subnetMask, setSubnetMask] = useState(scope?.subnet_mask || "");
  const [gateway, setGateway] = useState(scope?.gateway || "");
  const [dnsServers, setDnsServers] = useState(scope?.dns_servers || "");
  const [leaseDuration, setLeaseDuration] = useState(
    scope?.lease_duration ? Math.floor(scope.lease_duration / 3600).toString() : "24"
  );
  const [maxLeases, setMaxLeases] = useState(scope?.max_leases?.toString() || "");
  const [isActive, setIsActive] = useState(scope?.is_active ?? true);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubnets = async () => {
      try {
        const res = await api.get("/ipam/subnets/");
        if (res.data) {
          const subnetsData = extractIpamArrayData(res.data);
          setSubnets(subnetsData as Subnet[]);
        }
      } catch (err) {
        console.error("Error loading subnets:", err);
      }
    };
    loadSubnets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        subnet: parseInt(subnet),
        name,
        description: description || null,
        start_ip: startIp,
        end_ip: endIp,
        subnet_mask: subnetMask,
        gateway: gateway || null,
        dns_servers: dnsServers || null,
        lease_duration: parseInt(leaseDuration) * 3600, // Convert hours to seconds
        max_leases: maxLeases ? parseInt(maxLeases) : null,
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save DHCP scope");
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
            <Label htmlFor="subnet">Subnet *</Label>
            <Select value={subnet} onValueChange={setSubnet} required>
              <SelectTrigger>
                <SelectValue placeholder="Select subnet" />
              </SelectTrigger>
              <SelectContent>
                {subnets.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.network} - {s.description || "No description"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="start_ip">Start IP *</Label>
            <Input
              id="start_ip"
              type="text"
              value={startIp}
              onChange={(e) => setStartIp(e.target.value)}
              placeholder="192.168.1.10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_ip">End IP *</Label>
            <Input
              id="end_ip"
              type="text"
              value={endIp}
              onChange={(e) => setEndIp(e.target.value)}
              placeholder="192.168.1.254"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subnet_mask">Subnet Mask *</Label>
            <Input
              id="subnet_mask"
              type="text"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              placeholder="255.255.255.0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gateway">Gateway</Label>
            <Input
              id="gateway"
              type="text"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              placeholder="192.168.1.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dns_servers">DNS Servers (comma-separated)</Label>
            <Input
              id="dns_servers"
              type="text"
              value={dnsServers}
              onChange={(e) => setDnsServers(e.target.value)}
              placeholder="8.8.8.8, 8.8.4.4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_leases">Max Leases (optional)</Label>
            <Input
              id="max_leases"
              type="number"
              min="1"
              value={maxLeases}
              onChange={(e) => setMaxLeases(e.target.value)}
              placeholder="Unlimited if empty"
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
            {loading ? "Saving..." : scope ? "Update Scope" : "Create Scope"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
