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
import { Device, DeviceType, Rack } from "@/types/ipam";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: Partial<Device>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DeviceForm({ device, onSubmit, onCancel, loading }: DeviceFormProps) {
  const [name, setName] = useState(device?.name || "");
  const [ipAddress, setIpAddress] = useState(device?.ip_address || "");
  const [deviceType, setDeviceType] = useState(
    device?.device_type?.toString() || device?.device_type_detail?.id?.toString() || ""
  );
  const [location, setLocation] = useState(device?.location?.toString() || "");
  const [rack, setRack] = useState(device?.rack?.toString() || "");
  const [rackPosition, setRackPosition] = useState(device?.rack_position?.toString() || "");
  const [rackSize, setRackSize] = useState(device?.rack_size?.toString() || "");
  const [description, setDescription] = useState(device?.description || "");
  const [vendor, setVendor] = useState(device?.vendor || "");
  const [model, setModel] = useState(device?.model || "");
  const [version, setVersion] = useState(device?.version || "");
  const [switchPort, setSwitchPort] = useState<"wired" | "wireless" | "">(
    (device?.switch_port as "wired" | "wireless") || ""
  );
  const [sections, setSections] = useState<string[]>(device?.sections || []);
  const [isActive, setIsActive] = useState(device?.is_active ?? true);

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load device types
        const typesRes = await api.get("/ipam/device-types/");
        if (typesRes.data) {
          setDeviceTypes(extractIpamArrayData(typesRes.data) as DeviceType[]);
        }

        // Load locations
        const locsRes = await api.get("/infrastructure/locations/");
        if (locsRes.data) {
          setLocations(extractIpamArrayData(locsRes.data) as Array<{ id: number; name: string }>);
        }

        // Load racks
        const racksRes = await api.get("/ipam/racks/");
        if (racksRes.data) {
          setRacks(extractIpamArrayData(racksRes.data) as Rack[]);
        }
      } catch (err) {
        console.error("Error loading form data:", err);
      }
    };
    loadData();
  }, []);

  // Filter racks by selected location
  const filteredRacks = location
    ? racks.filter((r) => r.location === parseInt(location))
    : racks;

  const handleSectionToggle = (section: string) => {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        name,
        ip_address: ipAddress || null,
        device_type: deviceType ? parseInt(deviceType) : null,
        location: location ? parseInt(location) : null,
        rack: rack ? parseInt(rack) : null,
        rack_position: rackPosition ? parseInt(rackPosition) : null,
        rack_size: rackSize ? parseInt(rackSize) : null,
        description: description || null,
        vendor: vendor || null,
        model: model || null,
        version: version || null,
        switch_port: switchPort || null,
        sections: sections,
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save device");
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
            <Label htmlFor="name">Name (Hostname) *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hostname"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip_address">IP Address</Label>
            <Input
              id="ip_address"
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="device_type">Device Type</Label>
            <Select value={deviceType} onValueChange={setDeviceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rack">Rack</Label>
            <Select value={rack} onValueChange={setRack} disabled={!location}>
              <SelectTrigger>
                <SelectValue placeholder={location ? "Select rack" : "Select location first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {filteredRacks.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rack_position">Rack Position (U)</Label>
            <Input
              id="rack_position"
              type="number"
              min="1"
              value={rackPosition}
              onChange={(e) => setRackPosition(e.target.value)}
              placeholder="Position in rack"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rack_size">Rack Size (U)</Label>
            <Input
              id="rack_size"
              type="number"
              min="1"
              value={rackSize}
              onChange={(e) => setRackSize(e.target.value)}
              placeholder="Device size in rack units"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="switch_port">Switch Port</Label>
            <Select value={switchPort} onValueChange={(value) => setSwitchPort(value as "wired" | "wireless" | "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select switch port type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="wired">Wired</SelectItem>
                <SelectItem value="wireless">Wireless</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Vendor/manufacturer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Device model"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Version/firmware"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Sections to display device in:</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-servers"
                  checked={sections.includes("servers")}
                  onCheckedChange={() => handleSectionToggle("servers")}
                />
                <Label htmlFor="section-servers" className="cursor-pointer">
                  Servers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="section-ipv6"
                  checked={sections.includes("ipv6")}
                  onCheckedChange={() => handleSectionToggle("ipv6")}
                />
                <Label htmlFor="section-ipv6" className="cursor-pointer">
                  IPv6 Section
                </Label>
              </div>
            </div>
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
            {loading ? "Saving..." : device ? "Update Device" : "Add Device"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
