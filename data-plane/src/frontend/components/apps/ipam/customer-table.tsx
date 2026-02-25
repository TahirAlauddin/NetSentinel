"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Customer } from "@/types/ipam";

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

type SortField = "name" | "description" | "contact_email" | "contact_phone" | "created_at";
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
  if (currentSortField !== field) {
    return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1" />
  );
};

export function CustomerTable({ customers, onEdit, onDelete, onAdd }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const filteredAndSorted = useMemo(() => {
    let filtered = customers;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.description?.toLowerCase().includes(searchLower) ||
          customer.contact_email?.toLowerCase().includes(searchLower) ||
          customer.contact_phone?.toLowerCase().includes(searchLower)
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
        case "description":
          aValue = a.description || "";
          bValue = b.description || "";
          break;
        case "contact_email":
          aValue = a.contact_email || "";
          bValue = b.contact_email || "";
          break;
        case "contact_phone":
          aValue = a.contact_phone || "";
          bValue = b.contact_phone || "";
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
  }, [customers, searchTerm, sortField, sortDirection]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button onClick={onAdd} className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
          <Plus className="w-4 h-4" />
          Add customer
        </Button>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon field="name" currentSortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("description")}
              >
                <div className="flex items-center">
                  Address
                  <SortIcon field="description" currentSortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th
                className="text-left py-3 px-4 cursor-pointer hover:bg-[oklch(0.93_0_0)]"
                onClick={() => handleSort("contact_email")}
              >
                <div className="flex items-center">
                  Contact
                  <SortIcon field="contact_email" currentSortField={sortField} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  {searchTerm ? "No customers found matching your search" : "No customers available"}
                </td>
              </tr>
            ) : (
              paginated.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-[oklch(0.98_0_0)]">
                  <td className="py-3 px-4 font-medium">{customer.name}</td>
                  <td className="py-3 px-4">{customer.description || "-"}</td>
                  <td className="py-3 px-4">
                    {customer.contact_email || customer.contact_phone ? (
                      <div className="space-y-1">
                        {customer.contact_email && (
                          <div className="text-sm">{customer.contact_email}</div>
                        )}
                        {customer.contact_phone && (
                          <div className="text-sm text-muted-foreground">{customer.contact_phone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">/</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit?.(customer)}
                        className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => onDelete?.(customer.id)}
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

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of{" "}
            {filteredAndSorted.length} rows
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

