"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Activity } from "lucide-react";
import { DHCPScope } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";

interface DhcpScopeTableProps {
  scopes: DHCPScope[];
  onEdit?: (scope: DHCPScope) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onViewLeases?: (scope: DHCPScope) => void;
  onViewReservations?: (scope: DHCPScope) => void;
}

type SortField = "name" | "subnet" | "start_ip" | "end_ip" | "active_leases_count" | "is_active" | "created_at";
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

export function DhcpScopeTable({
  scopes,
  onEdit,
  onDelete,
  onAdd,
  onViewLeases,
  onViewReservations,
}: DhcpScopeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const filteredAndSorted = useMemo(() => {
    let filtered = scopes;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (scope) =>
          scope.name.toLowerCase().includes(searchLower) ||
          scope.subnet_detail?.network?.toLowerCase().includes(searchLower) ||
          scope.start_ip.toLowerCase().includes(searchLower) ||
          scope.end_ip.toLowerCase().includes(searchLower) ||
          scope.description?.toLowerCase().includes(searchLower)
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
        case "subnet":
          aValue = a.subnet_detail?.network || "";
          bValue = b.subnet_detail?.network || "";
          break;
        case "start_ip":
          aValue = a.start_ip;
          bValue = b.start_ip;
          break;
        case "end_ip":
          aValue = a.end_ip;
          bValue = b.end_ip;
          break;
        case "active_leases_count":
          aValue = a.active_leases_count || 0;
          bValue = b.active_leases_count || 0;
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
  }, [scopes, searchTerm, sortField, sortDirection]);

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
                placeholder="Search scopes..."
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
              Add Scope
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Name
                    <SortIcon field="name" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("subnet")}
                >
                  <div className="flex items-center">
                    Subnet
                    <SortIcon field="subnet" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("start_ip")}
                >
                  <div className="flex items-center">
                    Start IP
                    <SortIcon field="start_ip" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("end_ip")}
                >
                  <div className="flex items-center">
                    End IP
                    <SortIcon field="end_ip" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Lease Duration</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("active_leases_count")}
                >
                  <div className="flex items-center">
                    Active Leases
                    <SortIcon field="active_leases_count" currentSortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Available</th>
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
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    No DHCP scopes found
                  </td>
                </tr>
              ) : (
                paginated.map((scope) => (
                  <tr key={scope.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{scope.name}</td>
                    <td className="p-3">{scope.subnet_detail?.network || scope.subnet}</td>
                    <td className="p-3 font-mono text-sm">{scope.start_ip}</td>
                    <td className="p-3 font-mono text-sm">{scope.end_ip}</td>
                    <td className="p-3">
                      {scope.lease_duration ? `${Math.floor(scope.lease_duration / 3600)}h` : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{scope.active_leases_count || 0}</span>
                        {onViewLeases && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewLeases(scope)}
                            className="h-6 px-2"
                          >
                            <Activity className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {scope.available_ips !== undefined ? (
                        <span className="font-medium">{scope.available_ips}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={scope.is_active ? "default" : "secondary"}>
                        {scope.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {onViewReservations && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewReservations(scope)}
                            title="View Reservations"
                          >
                            Reservations
                          </Button>
                        )}
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(scope)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(scope.id)}
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
              {filteredAndSorted.length} scopes
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
