"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { DHCPReservation } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";

interface DhcpReservationTableProps {
  reservations: DHCPReservation[];
  onEdit?: (reservation: DHCPReservation) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

type SortField = "ip_address" | "mac_address" | "hostname" | "is_active" | "created_at";
type SortDirection = "asc" | "desc";

const SortIcon = ({ 
  field, 
  currentSortField, 
  sortDirection 
}: { 
  field: SortField; 
  currentSortField: SortField; 
  sortDirection: SortDirection;
}) => {
  if (currentSortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="h-4 w-4 ml-1" />
  ) : (
    <ArrowDown className="h-4 w-4 ml-1" />
  );
};

export function DhcpReservationTable({
  reservations,
  onEdit,
  onDelete,
  onAdd,
}: DhcpReservationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("ip_address");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const filteredAndSorted = useMemo(() => {
    let filtered = reservations;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reservation) =>
          reservation.ip_address.toLowerCase().includes(searchLower) ||
          reservation.mac_address.toLowerCase().includes(searchLower) ||
          reservation.hostname?.toLowerCase().includes(searchLower)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

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
        case "is_active":
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
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
  }, [reservations, searchTerm, sortField, sortDirection]);

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reservations..."
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
              Add Reservation
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
                    <SortIcon field="ip_address" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("mac_address")}
                >
                  <div className="flex items-center">
                    MAC Address
                    <SortIcon field="mac_address" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("hostname")}
                >
                  <div className="flex items-center">
                    Hostname
                    <SortIcon field="hostname" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Description</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("is_active")}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="is_active" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    No DHCP reservations found
                  </td>
                </tr>
              ) : (
                paginated.map((reservation) => (
                  <tr key={reservation.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-mono text-sm">{reservation.ip_address}</td>
                    <td className="p-3 font-mono text-sm">{reservation.mac_address}</td>
                    <td className="p-3">{reservation.hostname || "-"}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {reservation.description || "-"}
                    </td>
                    <td className="p-3">
                      <Badge variant={reservation.is_active ? "default" : "secondary"}>
                        {reservation.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(reservation)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(reservation.id)}
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
              {filteredAndSorted.length} reservations
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
