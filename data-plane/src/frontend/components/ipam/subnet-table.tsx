"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { Subnet, SubnetSortOptions } from "@/types/ipam";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { SubnetViews } from "./subnet-views";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* List or Grid View */}
      <SubnetViews
        subnets={paginatedSubnets}
        viewMode={viewMode}
        sortOptions={sortOptions}
        onSort={handleSort}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage={searchTerm ? "No subnets found matching your search" : "No subnets available"}
      />

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

