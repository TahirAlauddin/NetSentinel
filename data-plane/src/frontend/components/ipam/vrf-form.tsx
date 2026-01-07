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
import { VRF } from "@/types/ipam";
import { VrfCreateUpdateDto } from "@/types/ipam/dto";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface VrfFormProps {
  vrf?: VRF;
  onSubmit: (data: VrfCreateUpdateDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function VrfForm({ vrf, onSubmit, onCancel, loading }: VrfFormProps) {
  const [name, setName] = useState(vrf?.name || "");
  const [rd, setRd] = useState(vrf?.rd || "");
  const [description, setDescription] = useState(vrf?.description || "");
  const [location, setLocation] = useState(vrf?.location?.toString() || "");
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await api.get("/api/v1/infrastructure/locations/");
        if (res.data) {
          const locationsData = extractIpamArrayData<{ id: number; name: string }>(res.data);
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
        name,
        rd: rd || null,
        description: description || null,
        location: location ? parseInt(location) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save VRF");
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rd">Route Distinguisher</Label>
            <Input
              id="rd"
              value={rd}
              onChange={(e) => setRd(e.target.value)}
              placeholder="65000:100"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Select value={location || undefined} onValueChange={(value) => setLocation(value || "")}>
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
            {loading ? "Saving..." : vrf ? "Update VRF" : "Create VRF"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

