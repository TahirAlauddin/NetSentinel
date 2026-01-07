"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, List, Grid, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Subnet, SubnetSortOptions } from "@/types/ipam";

interface SubnetTableProps {
  subnets: Subnet[];
  onEdit?: (subnet: Subnet) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onFind?: () => void;
}

/**
 * SubnetTable component
 * Displays subnets in a table format with search, filtering, and sorting
 */
export function SubnetTable({
  subnets,
  onEdit,
  onDelete,
  onAdd,
  onFind,
}: SubnetTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOptions, setSortOptions] = useState<SubnetSortOptions>({
    field: "network",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  // Filter and sort subnets
  const filteredAndSortedSubnets = useMemo(() => {
    let filtered = subnets;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((subnet) => {
        return (
          subnet.network.toLowerCase().includes(searchLower) ||
          subnet.description?.toLowerCase().includes(searchLower) ||
          subnet.vlan_detail?.name.toLowerCase().includes(searchLower) ||
          subnet.vrf_detail?.name.toLowerCase().includes(searchLower) ||
          subnet.customer_detail?.name.toLowerCase().includes(searchLower) ||
          subnet.location_detail?.name.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortOptions.field) {
        case "network":
          aValue = a.network;
          bValue = b.network;
          break;
        case "description":
          aValue = a.description || "";
          bValue = b.description || "";
          break;
        case "vlan":
          aValue = a.vlan_detail?.name || "";
          bValue = b.vlan_detail?.name || "";
          break;
        case "vrf":
          aValue = a.vrf_detail?.name || "";
          bValue = b.vrf_detail?.name || "";
          break;
        case "customer":
          aValue = a.customer_detail?.name || "";
          bValue = b.customer_detail?.name || "";
          break;
        case "location":
          aValue = a.location_detail?.name || "";
          bValue = b.location_detail?.name || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOptions.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subnets, searchTerm, sortOptions]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSubnets.length / itemsPerPage);
  const paginatedSubnets = filteredAndSortedSubnets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SubnetSortOptions["field"]) => {
    setSortOptions((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderSortIcon = (field: SubnetSortOptions["field"]) => {
    if (sortOptions.field !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    }
    return sortOptions.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  return (
    <Card className="p-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={onAdd}
            className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]"
          >
            <Plus className="w-4 h-4" />
            Add subnet
          </Button>
          <Button
            onClick={onFind}
            variant="outline"
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Find subnet
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md">
            <button
              className="p-2 hover:bg-[oklch(0.93_0_0)] rounded-l-md"
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-[oklch(0.93_0_0)] rounded-r-md border-l"
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("network")}
              >
                <div className="flex items-center">
                  Subnet
                  {renderSortIcon("network")}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("description")}
              >
                <div className="flex items-center">
                  Description
                  {renderSortIcon("description")}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("vlan")}
              >
                <div className="flex items-center">
                  VLAN
                  {renderSortIcon("vlan")}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("vrf")}
              >
                <div className="flex items-center">
                  VRF
                  {renderSortIcon("vrf")}
                </div>
              </th>
              <th className="text-left py-3 px-4">Master Subnet</th>
              <th className="text-left py-3 px-4">Device</th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("customer")}
              >
                <div className="flex items-center">
                  Customer
                  {renderSortIcon("customer")}
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("location")}
              >
                <div className="flex items-center">
                  Subnet Location
                  {renderSortIcon("location")}
                </div>
              </th>
              <th className="text-left py-3 px-4">Contact</th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Routable
                  {renderSortIcon("status")}
                </div>
              </th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubnets.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-muted-foreground">
                  {searchTerm ? "No subnets found matching your search" : "No subnets available"}
                </td>
              </tr>
            ) : (
              paginatedSubnets.map((subnet) => (
                <tr key={subnet.id} className="border-b hover:bg-[oklch(0.98_0_0)]">
                  <td className="py-3 px-4">
                    <a
                      href={`/ipam/subnets/${subnet.id}`}
                      className="font-mono text-sm text-[oklch(0.40_0.15_249)] hover:underline"
                    >
                      {subnet.network}
                    </a>
                  </td>
                  <td className="py-3 px-4">{subnet.description || "/"}</td>
                  <td className="py-3 px-4">
                    {subnet.vlan_detail ? (
                      <span>{subnet.vlan_detail.vlan_id || subnet.vlan_detail.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Default</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {subnet.vrf_detail ? (
                      <span>{subnet.vrf_detail.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Default</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {subnet.master_subnet_detail ? (
                      <span className="font-mono text-xs">{subnet.master_subnet_detail.network}</span>
                    ) : (
                      <span className="text-muted-foreground">/</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-muted-foreground">/</span>
                  </td>
                  <td className="py-3 px-4">
                    {subnet.customer_detail ? (
                      <span>{subnet.customer_detail.name}</span>
                    ) : (
                      <span className="text-muted-foreground">/</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {subnet.location_detail ? (
                      <span>{subnet.location_detail.name}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-muted-foreground">-</span>
                  </td>
                  <td className="py-3 px-4">
                    {subnet.status === "active" ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit?.(subnet)}
                        className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => onDelete?.(subnet.id)}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedSubnets.length)} of{" "}
            {filteredAndSortedSubnets.length} rows
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
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
    </Card>
  );
}

