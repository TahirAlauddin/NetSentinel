"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Customer } from "@/types/ipam";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

export function CustomerTable({ customers, onEdit, onDelete, onAdd }: CustomerTableProps) {
  const columns: ListColumn<Customer>[] = useMemo(
    () => [
      { key: "name", header: "Title", sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
      { key: "description", header: "Address", sortable: true, render: (c) => c.description || "-" },
      {
        key: "contact_email",
        header: "Contact",
        sortable: true,
        render: (c) =>
          c.contact_email || c.contact_phone ? (
            <div className="space-y-1">
              {c.contact_email && <div className="text-sm">{c.contact_email}</div>}
              {c.contact_phone && <div className="text-sm text-muted-foreground">{c.contact_phone}</div>}
            </div>
          ) : (
            <span className="text-muted-foreground">/</span>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (customer) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(customer); }}
              className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(customer.id); }}
              className="p-1 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  return (
    <DataList<Customer>
      data={customers}
      columns={columns}
      searchPlaceholder="Search customers..."
      searchKeys={["name", "description", "contact_email", "contact_phone"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No customers available"
      showViewToggle={false}
      headerActions={
        <Button
          onClick={onAdd}
          className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]"
        >
          <Plus className="w-4 h-4" />
          Add customer
        </Button>
      }
    />
  );
}
