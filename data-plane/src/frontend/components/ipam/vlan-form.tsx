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
import { VLAN } from "@/types/ipam";
import { VlanCreateUpdateDto } from "@/types/ipam/dto";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface VlanFormProps {
  vlan?: VLAN;
  onSubmit: (data: VlanCreateUpdateDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function VlanForm({ vlan, onSubmit, onCancel, loading }: VlanFormProps) {
  const [vlanId, setVlanId] = useState(vlan?.vlan_id?.toString() || "");
  const [name, setName] = useState(vlan?.name || "");
  const [description, setDescription] = useState(vlan?.description || "");
  const [location, setLocation] = useState(vlan?.location?.toString() || "");
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await api.get("/infrastructure/locations/");
        if (res.data) {
          const locationsData = extractIpamArrayData(res.data);
          setLocations(locationsData as Array<{ id: number; name: string }>);
        }
      } catch (err) {
        console.error("Error loading locations:", err);
      }
    };
    loadLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        vlan_id: parseInt(vlanId),
        name,
        description: description || null,
        location: parseInt(location),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save VLAN");
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
            <Label htmlFor="vlan_id">VLAN ID (1-4094) *</Label>
            <Input
              id="vlan_id"
              type="number"
              min="1"
              max="4094"
              value={vlanId}
              onChange={(e) => setVlanId(e.target.value)}
              required
            />
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={location} onValueChange={setLocation} required>
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
            {loading ? "Saving..." : vlan ? "Update VLAN" : "Create VLAN"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

