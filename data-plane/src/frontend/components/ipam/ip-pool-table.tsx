"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { IPPool } from "@/types/ipam";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface IpPoolTableProps {
  pools: IPPool[];
  onEdit?: (pool: IPPool) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onViewUtilization?: (pool: IPPool) => void;
}

type SortField = "name" | "subnet" | "start_ip" | "end_ip" | "utilization_percentage" | "is_active" | "created_at";
type SortDirection = "asc" | "desc";

export function IpPoolTable({
  pools,
  onEdit,
  onDelete,
  onAdd,
  onViewUtilization,
}: IpPoolTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const filteredAndSorted = useMemo(() => {
    let filtered = pools;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pool) =>
          pool.name.toLowerCase().includes(searchLower) ||
          pool.subnet_detail?.network?.toLowerCase().includes(searchLower) ||
          pool.start_ip.toLowerCase().includes(searchLower) ||
          pool.end_ip.toLowerCase().includes(searchLower) ||
          pool.description?.toLowerCase().includes(searchLower)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
        case "utilization_percentage":
          aValue = a.utilization_percentage || 0;
          bValue = b.utilization_percentage || 0;
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
  }, [pools, searchTerm, sortField, sortDirection]);

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

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search pools..."
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
              Add Pool
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
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("subnet")}
                >
                  <div className="flex items-center">
                    Subnet
                    <SortIcon field="subnet" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("start_ip")}
                >
                  <div className="flex items-center">
                    Start IP
                    <SortIcon field="start_ip" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("end_ip")}
                >
                  <div className="flex items-center">
                    End IP
                    <SortIcon field="end_ip" />
                  </div>
                </th>
                <th className="text-left p-3">Reservation Policy</th>
                <th className="text-left p-3">Available</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("utilization_percentage")}
                >
                  <div className="flex items-center">
                    Utilization
                    <SortIcon field="utilization_percentage" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("is_active")}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="is_active" />
                  </div>
                </th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    No IP pools found
                  </td>
                </tr>
              ) : (
                paginated.map((pool) => (
                  <tr key={pool.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{pool.name}</td>
                    <td className="p-3">{pool.subnet_detail?.network || pool.subnet}</td>
                    <td className="p-3 font-mono text-sm">{pool.start_ip}</td>
                    <td className="p-3 font-mono text-sm">{pool.end_ip}</td>
                    <td className="p-3 text-sm">{pool.reservation_policy_display}</td>
                    <td className="p-3">
                      {pool.available_count !== undefined ? (
                        <span className="font-medium">{pool.available_count}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      {pool.utilization_percentage !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full",
                                pool.utilization_percentage > 80
                                  ? "bg-red-500"
                                  : pool.utilization_percentage > 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              )}
                              style={{ width: `${Math.min(pool.utilization_percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{pool.utilization_percentage.toFixed(1)}%</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={pool.is_active ? "default" : "secondary"}>
                        {pool.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {onViewUtilization && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewUtilization(pool)}
                            title="View Utilization"
                          >
                            Stats
                          </Button>
                        )}
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(pool)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(pool.id)}
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
              {filteredAndSorted.length} pools
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
