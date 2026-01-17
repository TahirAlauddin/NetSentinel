"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PhoneNumberRange } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";

interface PhoneNumberTableProps {
  phoneNumbers: PhoneNumberRange[];
  onEdit?: (phoneNumber: PhoneNumberRange) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

type SortField = "start_number" | "stop_number" | "carrier" | "trunk" | "location" | "created_at";
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
  if (currentSortField !== field) return <ArrowUpDown className="h-4 w-4" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="h-4 w-4" />
  ) : (
    <ArrowDown className="h-4 w-4" />
  );
};

export function PhoneNumberTable({
  phoneNumbers,
  onEdit,
  onDelete,
  onAdd,
}: PhoneNumberTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("start_number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const filteredAndSorted = useMemo(() => {
    let filtered = phoneNumbers;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pn) =>
          pn.start_number.toLowerCase().includes(searchLower) ||
          pn.stop_number.toLowerCase().includes(searchLower) ||
          pn.carrier?.toLowerCase().includes(searchLower) ||
          pn.trunk?.toLowerCase().includes(searchLower) ||
          pn.location_detail?.name.toLowerCase().includes(searchLower) ||
          pn.notes?.toLowerCase().includes(searchLower)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "start_number":
          aValue = a.start_number;
          bValue = b.start_number;
          break;
        case "stop_number":
          aValue = a.stop_number;
          bValue = b.stop_number;
          break;
        case "carrier":
          aValue = a.carrier || "";
          bValue = b.carrier || "";
          break;
        case "trunk":
          aValue = a.trunk || "";
          bValue = b.trunk || "";
          break;
        case "location":
          aValue = a.location_detail?.name || "";
          bValue = b.location_detail?.name || "";
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
  }, [phoneNumbers, searchTerm, sortField, sortDirection]);

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
    setCurrentPage(1);
  };

  return (
    <Card>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Phone Number Ranges</h2>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Phone Number Range
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search phone numbers, carrier, trunk, location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("start_number")}
                  className="h-auto p-0 font-semibold"
                >
                  Start Number
                  <SortIcon field="start_number" currentSortField={sortField} sortDirection={sortDirection} />
                </Button>
              </th>
              <th className="text-left p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("stop_number")}
                  className="h-auto p-0 font-semibold"
                >
                  Stop Number
                  <SortIcon field="stop_number" currentSortField={sortField} sortDirection={sortDirection} />
                </Button>
              </th>
              <th className="text-left p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("location")}
                  className="h-auto p-0 font-semibold"
                >
                  Location
                  <SortIcon field="location" currentSortField={sortField} sortDirection={sortDirection} />
                </Button>
              </th>
              <th className="text-left p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("carrier")}
                  className="h-auto p-0 font-semibold"
                >
                  Carrier
                  <SortIcon field="carrier" currentSortField={sortField} sortDirection={sortDirection} />
                </Button>
              </th>
              <th className="text-left p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("trunk")}
                  className="h-auto p-0 font-semibold"
                >
                  Trunk
                  <SortIcon field="trunk" currentSortField={sortField} sortDirection={sortDirection} />
                </Button>
              </th>
              <th className="text-left p-3">Count</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "No phone number ranges found matching your search" : "No phone number ranges"}
                </td>
              </tr>
            ) : (
              paginated.map((pn) => (
                <tr key={pn.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-mono">{pn.start_number}</td>
                  <td className="p-3 font-mono">{pn.stop_number}</td>
                  <td className="p-3">
                    {pn.location_detail ? (
                      <span>{pn.location_detail.name}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {pn.carrier ? (
                      <Badge variant="outline">{pn.carrier}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {pn.trunk ? (
                      <span className="font-mono text-sm">{pn.trunk}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{pn.number_count}</Badge>
                  </td>
                  <td className="p-3">
                    {pn.notes ? (
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {pn.notes}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(pn)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(pn.id)}
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
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of{" "}
            {filteredAndSorted.length} phone number ranges
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
    </Card>
  );
}
