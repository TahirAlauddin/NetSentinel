"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Server } from "lucide-react";
import { Device } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type SortField = "name" | "ip_address" | "device_type" | "location" | "rack" | "hosts_count" | "created_at";
type SortDirection = "asc" | "desc";

// SortIcon component must be declared outside the render function
interface SortIconProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
}

function SortIcon({ field, currentField, direction }: SortIconProps) {
  if (currentField !== field) {
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  }
  return direction === "asc" ? (
    <ArrowUp className="h-4 w-4 ml-1" />
  ) : (
    <ArrowDown className="h-4 w-4 ml-1" />
  );
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDeviceType, setFilterDeviceType] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterRack, setFilterRack] = useState<string>("");
  const [filterSection, setFilterSection] = useState<string>("");
  const itemsPerPage = 18;

  // Notify parent of filter changes
  useMemo(() => {
    if (onFilterChange) {
      onFilterChange({
        deviceType: filterDeviceType ? parseInt(filterDeviceType) : undefined,
        location: filterLocation ? parseInt(filterLocation) : undefined,
        rack: filterRack ? parseInt(filterRack) : undefined,
        section: filterSection || undefined,
      });
    }
  }, [filterDeviceType, filterLocation, filterRack, filterSection, onFilterChange]);

  const filteredAndSorted = useMemo(() => {
    let filtered = devices;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (device) =>
          device.name.toLowerCase().includes(searchLower) ||
          device.ip_address?.toLowerCase().includes(searchLower) ||
          device.vendor?.toLowerCase().includes(searchLower) ||
          device.model?.toLowerCase().includes(searchLower) ||
          device.description?.toLowerCase().includes(searchLower)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "ip_address":
          aValue = a.ip_address || "";
          bValue = b.ip_address || "";
          break;
        case "device_type":
          aValue = a.device_type_detail?.name || "";
          bValue = b.device_type_detail?.name || "";
          break;
        case "location":
          aValue = a.location_detail?.name || "";
          bValue = b.location_detail?.name || "";
          break;
        case "rack":
          aValue = a.rack_detail?.name || "";
          bValue = b.rack_detail?.name || "";
          break;
        case "hosts_count":
          aValue = a.hosts_count || 0;
          bValue = b.hosts_count || 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [devices, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium">Filter by:</div>
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 w-12"></th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Name
                    <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("ip_address")}
                >
                  <div className="flex items-center">
                    IP Address
                    <SortIcon field="ip_address" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Description</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("rack")}
                >
                  <div className="flex items-center">
                    Rack
                    <SortIcon field="rack" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("location")}
                >
                  <div className="flex items-center">
                    Location
                    <SortIcon field="location" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("hosts_count")}
                >
                  <div className="flex items-center">
                    Number of Hosts
                    <SortIcon field="hosts_count" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("device_type")}
                >
                  <div className="flex items-center">
                    Type
                    <SortIcon field="device_type" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Vendor</th>
                <th className="text-left p-3">Model</th>
                <th className="text-left p-3">Version</th>
                <th className="text-left p-3">SwitchPort</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center p-8 text-muted-foreground">
                    No devices found
                  </td>
                </tr>
              ) : (
                paginated.map((device) => (
                  <tr key={device.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </td>
                    <td className="p-3 font-medium">{device.name}</td>
                    <td className="p-3 font-mono text-sm">{device.ip_address || "-"}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {device.description || "-"}
                    </td>
                    <td className="p-3">
                      {device.rack_detail ? (
                        <div className="text-sm">
                          <div>{device.rack_detail.name}</div>
                          {device.rack_position && device.rack_size && (
                            <div className="text-xs text-muted-foreground">
                              Position: {device.rack_position}, Size: {device.rack_size} U
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">{device.location_detail?.name || "-"}</td>
                    <td className="p-3">
                      {device.hosts_count !== undefined ? (
                        <span>{device.hosts_count} Objects</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      {device.device_type_detail ? (
                        <Badge variant="secondary">{device.device_type_detail.name}</Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 text-sm">{device.vendor || "-"}</td>
                    <td className="p-3 text-sm">{device.model || "-"}</td>
                    <td className="p-3 text-sm">{device.version || "-"}</td>
                    <td className="p-3">
                      {device.switch_port ? (
                        <Badge variant="outline">{device.switch_port}</Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(device)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(device.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of{" "}
              {filteredAndSorted.length} devices
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
