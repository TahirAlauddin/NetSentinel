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
import { Subnet } from "@/types/ipam";
import { SubnetCreateUpdateDto } from "@/types/ipam/dto";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { api } from "@/lib/utils";

const ipamApi = new IpamApiClient();

interface SubnetFormProps {
  subnet?: Subnet;
  onSubmit: (data: SubnetCreateUpdateDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  network: string;
  description: string;
  group: string;
  location: string;
  vlan: string;
  vrf: string;
  gateway_ip: string;
  nameservers: string;
  master_subnet: string;
  customer: string;
  status: "planned" | "active" | "deprecated";
}

export function SubnetForm({ subnet, onSubmit, onCancel, loading }: SubnetFormProps) {
  const [formData, setFormData] = useState<FormData>({
    network: subnet?.network || "",
    description: subnet?.description || "",
    group: subnet?.group?.toString() || "",
    location: subnet?.location?.toString() || "",
    vlan: subnet?.vlan?.toString() || "",
    vrf: subnet?.vrf?.toString() || "",
    gateway_ip: subnet?.gateway_ip || "",
    nameservers: subnet?.nameservers || "",
    master_subnet: subnet?.master_subnet?.toString() || "",
    customer: subnet?.customer?.toString() || "",
    status: subnet?.status || "active",
  });

  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [vlans, setVlans] = useState<Array<{ id: number; name: string }>>([]);
  const [vrfs, setVrfs] = useState<Array<{ id: number; name: string }>>([]);
  const [subnets, setSubnets] = useState<Array<{ id: number; network: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [groupsRes, locationsRes, vlansRes, vrfsRes, subnetsRes, customersRes] = await Promise.all([
          ipamApi.getSubnetGroups(),
          api.get("/api/v1/infrastructure/locations/"),
          ipamApi.getVlans(),
          ipamApi.getVrfs(),
          ipamApi.getSubnets(),
          ipamApi.getCustomers(),
        ]);

        if (groupsRes.data) {
          const groupsData = Array.isArray(groupsRes.data) 
            ? groupsRes.data 
            : (groupsRes.data as { results?: Array<{ id: number; name: string }> })?.results || [];
          setGroups(groupsData as Array<{ id: number; name: string }>);
        }
        if (locationsRes.data) {
          const locationsData = Array.isArray(locationsRes.data) 
            ? locationsRes.data 
            : (locationsRes.data as { results?: Array<{ id: number; name: string }> })?.results || [];
          setLocations(locationsData as Array<{ id: number; name: string }>);
        }
        if (vlansRes.data) setVlans(extractIpamArrayData(vlansRes.data));
        if (vrfsRes.data) setVrfs(extractIpamArrayData(vrfsRes.data));
        if (subnetsRes.data) {
          const subs = extractIpamArrayData(subnetsRes.data);
          setSubnets(subs.filter((s: Subnet) => !subnet || s.id !== subnet.id));
        }
        if (customersRes.data) setCustomers(extractIpamArrayData(customersRes.data));
      } catch (err) {
        console.error("Error loading form options:", err);
      }
    };

    loadOptions();
  }, [subnet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const submitData: SubnetCreateUpdateDto = {
        network: formData.network,
        description: formData.description || null,
        group: parseInt(formData.group),
        location: parseInt(formData.location),
        status: formData.status,
      };

      if (formData.vlan) submitData.vlan = parseInt(formData.vlan);
      if (formData.vrf) submitData.vrf = parseInt(formData.vrf);
      if (formData.gateway_ip) submitData.gateway_ip = formData.gateway_ip;
      if (formData.nameservers) submitData.nameservers = formData.nameservers;
      if (formData.master_subnet) submitData.master_subnet = parseInt(formData.master_subnet);
      if (formData.customer) submitData.customer = parseInt(formData.customer);

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subnet");
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
            <Label htmlFor="network">Network (CIDR) *</Label>
            <Input
              id="network"
              value={formData.network}
              onChange={(e) => setFormData({ ...formData, network: e.target.value })}
              placeholder="192.168.1.0/24"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "planned" | "active" | "deprecated") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Subnet Group *</Label>
            <Select
              value={formData.group}
              onValueChange={(value) => setFormData({ ...formData, group: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData({ ...formData, location: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vlan">VLAN</Label>
            <Select
              value={formData.vlan}
              onValueChange={(value) => setFormData({ ...formData, vlan: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select VLAN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vlans.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vrf">VRF</Label>
            <Select
              value={formData.vrf}
              onValueChange={(value) => setFormData({ ...formData, vrf: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select VRF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vrfs.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="master_subnet">Master Subnet</Label>
            <Select
              value={formData.master_subnet}
              onValueChange={(value) => setFormData({ ...formData, master_subnet: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select master subnet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {subnets.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.network}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select
              value={formData.customer}
              onValueChange={(value) => setFormData({ ...formData, customer: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gateway_ip">Gateway IP</Label>
            <Input
              id="gateway_ip"
              value={formData.gateway_ip}
              onChange={(e) => setFormData({ ...formData, gateway_ip: e.target.value })}
              placeholder="192.168.1.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameservers">Nameservers</Label>
            <Input
              id="nameservers"
              value={formData.nameservers}
              onChange={(e) => setFormData({ ...formData, nameservers: e.target.value })}
              placeholder="8.8.8.8, 8.8.4.4"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : subnet ? "Update Subnet" : "Create Subnet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

