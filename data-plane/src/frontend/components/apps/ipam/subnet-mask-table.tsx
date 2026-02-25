"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SubnetMaskInfo } from "@/lib/ipam/subnet-mask-utils";

interface SubnetMaskTableProps {
  masks: SubnetMaskInfo[];
  loading?: boolean;
}

type SortField = "bitmask" | "netmask" | "hosts" | "subnets";
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

export function SubnetMaskTable({ masks, loading }: SubnetMaskTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("bitmask");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const filteredAndSorted = useMemo(() => {
    let filtered = masks;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (mask) =>
          mask.bitmask.toString().includes(searchLower) ||
          mask.netmask.toLowerCase().includes(searchLower) ||
          mask.wildcard_mask.toLowerCase().includes(searchLower) ||
          mask.hosts.toString().includes(searchLower)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "bitmask":
          aValue = a.bitmask;
          bValue = b.bitmask;
          break;
        case "netmask":
          aValue = a.netmask;
          bValue = b.netmask;
          break;
        case "hosts":
          aValue = typeof a.hosts === "number" ? a.hosts : 0;
          bValue = typeof b.hosts === "number" ? b.hosts : 0;
          break;
        case "subnets":
          aValue = typeof a.subnets === "number" ? a.subnets : 0;
          bValue = typeof b.subnets === "number" ? b.subnets : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [masks, searchTerm, sortField, sortDirection]);

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
      setSortDirection("desc");
    }
  };

  const formatNumber = (num: number | string): string => {
    if (typeof num === "string") return num;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    }
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading subnet masks...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by bitmask, netmask, or hosts..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("bitmask")}
                >
                  <div className="flex items-center">
                    Bitmask
                    <SortIcon field="bitmask" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("netmask")}
                >
                  <div className="flex items-center">
                    Netmask
                    <SortIcon field="netmask" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Wildcard Mask</th>
                <th className="text-left p-3">Binary</th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("subnets")}
                >
                  <div className="flex items-center">
                    Subnets
                    <SortIcon field="subnets" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("hosts")}
                >
                  <div className="flex items-center">
                    Hosts
                    <SortIcon field="hosts" currentField={sortField} direction={sortDirection} />
                  </div>
                </th>
                <th className="text-left p-3">Subnet Bits</th>
                <th className="text-left p-3">Host Bits</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    No subnet masks found
                  </td>
                </tr>
              ) : (
                paginated.map((mask) => (
                  <tr key={mask.bitmask} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">/{mask.bitmask}</td>
                    <td className="p-3 font-mono text-sm">{mask.netmask}</td>
                    <td className="p-3 font-mono text-sm">
                      {mask.wildcard_mask !== "Not applicable for IPv6" ? mask.wildcard_mask : "-"}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {mask.binary.length > 50 ? (
                        <span title={mask.binary}>{mask.binary.substring(0, 50)}...</span>
                      ) : (
                        mask.binary
                      )}
                    </td>
                    <td className="p-3">{formatNumber(mask.subnets)}</td>
                    <td className="p-3">
                      {typeof mask.hosts === "number" ? formatNumber(mask.hosts) : mask.hosts}
                    </td>
                    <td className="p-3">{mask.subnet_bits}</td>
                    <td className="p-3">{mask.host_bits}</td>
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
              {filteredAndSorted.length} subnet masks
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
