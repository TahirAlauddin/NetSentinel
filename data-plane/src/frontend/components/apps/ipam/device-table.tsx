"use client";

import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Server } from "lucide-react";
import { Device } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface DeviceTableProps {
  devices: Device[];
  onEdit?: (device: Device) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  deviceTypes?: Array<{ id: number; name: string }>;
  locations?: Array<{ id: number; name: string }>;
  racks?: Array<{ id: number; name: string }>;
  onFilterChange?: (filters: {
    deviceType?: number;
    location?: number;
    rack?: number;
    section?: string;
  }) => void;
}

export function DeviceTable({
  devices,
  onEdit,
  onDelete,
  onAdd,
  deviceTypes = [],
  locations = [],
  racks = [],
  onFilterChange,
}: DeviceTableProps) {
  const [filterDeviceType, setFilterDeviceType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterRack, setFilterRack] = useState("");
  const [filterSection, setFilterSection] = useState("");

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        deviceType: filterDeviceType ? parseInt(filterDeviceType) : undefined,
        location: filterLocation ? parseInt(filterLocation) : undefined,
        rack: filterRack ? parseInt(filterRack) : undefined,
        section: filterSection || undefined,
      });
    }
  }, [filterDeviceType, filterLocation, filterRack, filterSection, onFilterChange]);

  const columns: ListColumn<Device>[] = useMemo(
    () => [
      {
        key: "icon",
        header: "",
        sortable: false,
        render: () => <Server className="h-4 w-4 text-muted-foreground" />,
      },
      { key: "name", header: "Name", sortable: true, render: (d) => <span className="font-medium">{d.name}</span> },
      { key: "ip_address", header: "IP Address", sortable: true, render: (d) => <span className="font-mono text-sm">{d.ip_address || "-"}</span> },
      { key: "description", header: "Description", sortable: false, render: (d) => <span className="text-sm text-muted-foreground">{d.description || "-"}</span> },
      {
        key: "rack",
        header: "Rack",
        sortable: false,
        render: (d) =>
          d.rack_detail ? (
            <div className="text-sm">
              <div>{d.rack_detail.name}</div>
              {d.rack_position && d.rack_size && (
                <div className="text-xs text-muted-foreground">
                  Position: {d.rack_position}, Size: {d.rack_size} U
                </div>
              )}
            </div>
          ) : (
            "-"
          ),
      },
      {
        key: "location",
        header: "Location",
        sortable: false,
        render: (d) => d.location_detail?.name || "-",
      },
      {
        key: "hosts_count",
        header: "Number of Hosts",
        sortable: true,
        render: (d) => (d.hosts_count !== undefined ? <span>{d.hosts_count} Objects</span> : "-"),
      },
      {
        key: "device_type",
        header: "Type",
        sortable: false,
        render: (d) => (d.device_type_detail ? <Badge variant="secondary">{d.device_type_detail.name}</Badge> : "-"),
      },
      { key: "vendor", header: "Vendor", sortable: false, render: (d) => <span className="text-sm">{d.vendor || "-"}</span> },
      { key: "model", header: "Model", sortable: false, render: (d) => <span className="text-sm">{d.model || "-"}</span> },
      { key: "version", header: "Version", sortable: false, render: (d) => <span className="text-sm">{d.version || "-"}</span> },
      {
        key: "switch_port",
        header: "SwitchPort",
        sortable: false,
        render: (d) => (d.switch_port ? <Badge variant="outline">{d.switch_port}</Badge> : "-"),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (device) => (
          <div className="flex items-center justify-end gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(device); }}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(device.id); }} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const filterUi =
    onFilterChange && (deviceTypes.length > 0 || locations.length > 0 || racks.length > 0) ? (
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium">Filter by:</span>
        <Select value={filterDeviceType} onValueChange={setFilterDeviceType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Device type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {deviceTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id.toString()}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRack} onValueChange={setFilterRack}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rack" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Racks</SelectItem>
            {racks.map((rack) => (
              <SelectItem key={rack.id} value={rack.id.toString()}>
                {rack.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sections</SelectItem>
            <SelectItem value="servers">Servers</SelectItem>
            <SelectItem value="ipv6">IPv6 Section</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ) : null;

  return (
    <DataList<Device>
      data={devices}
      columns={columns}
      searchPlaceholder="Search devices..."
      searchKeys={["name", "ip_address", "vendor", "model", "description"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No devices found"
      showViewToggle={false}
      headerActions={
        <>
          {filterUi}
          {onAdd && (
            <Button onClick={onAdd} className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          )}
        </>
      }
    />
  );
}
