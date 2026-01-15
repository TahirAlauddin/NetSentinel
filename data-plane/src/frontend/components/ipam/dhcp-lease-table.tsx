"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { DHCPLease } from "@/types/ipam";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DhcpLeaseTableProps {
  leases: DHCPLease[];
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onRelease?: (id: number) => void;
}

type SortField = "ip_address" | "mac_address" | "hostname" | "status" | "lease_end" | "time_remaining" | "created_at";
type SortDirection = "asc" | "desc";

export function DhcpLeaseTable({
  leases,
  onDelete,
  onAdd,
  onRelease,
}: DhcpLeaseTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("ip_address");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const filteredAndSorted = useMemo(() => {
    let filtered = leases;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lease) =>
          lease.ip_address.toLowerCase().includes(searchLower) ||
          lease.mac_address.toLowerCase().includes(searchLower) ||
          lease.hostname?.toLowerCase().includes(searchLower) ||
          lease.scope_detail?.name.toLowerCase().includes(searchLower)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "ip_address":
          aValue = a.ip_address;
          bValue = b.ip_address;
          break;
        case "mac_address":
          aValue = a.mac_address;
          bValue = b.mac_address;
          break;
        case "hostname":
          aValue = a.hostname || "";
          bValue = b.hostname || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "lease_end":
          aValue = new Date(a.lease_end).getTime();
          bValue = new Date(b.lease_end).getTime();
          break;
        case "time_remaining":
          aValue = a.time_remaining || 0;
          bValue = b.time_remaining || 0;
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
  }, [leases, searchTerm, sortField, sortDirection]);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "Expired";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "expired":
        return "destructive";
      case "released":
        return "secondary";
      case "declined":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search leases..."
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
              Add Lease
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("ip_address")}
                >
                  <div className="flex items-center">
                    IP Address
                    <SortIcon field="ip_address" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("mac_address")}
                >
                  <div className="flex items-center">
                    MAC Address
                    <SortIcon field="mac_address" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("hostname")}
                >
                  <div className="flex items-center">
                    Hostname
                    <SortIcon field="hostname" />
                  </div>
                </th>
                <th className="text-left p-3">Scope</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("time_remaining")}
                >
                  <div className="flex items-center">
                    Time Remaining
                    <SortIcon field="time_remaining" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("lease_end")}
                >
                  <div className="flex items-center">
                    Lease End
                    <SortIcon field="lease_end" />
                  </div>
                </th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    No DHCP leases found
                  </td>
                </tr>
              ) : (
                paginated.map((lease) => (
                  <tr key={lease.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{lease.ip_address}</td>
                    <td className="p-3 font-mono text-sm">{lease.mac_address}</td>
                    <td className="p-3">{lease.hostname || "-"}</td>
                    <td className="p-3">{lease.scope_detail?.name || lease.scope}</td>
                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(lease.status)}>
                        {lease.status_display}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {lease.status === "active" ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeRemaining(lease.time_remaining)}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(lease.lease_end).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {onRelease && lease.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRelease(lease.id)}
                            title="Release Lease"
                          >
                            Release
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(lease.id)}
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
              {filteredAndSorted.length} leases
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
