"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { PhoneNumberRange } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface PhoneNumberTableProps {
  phoneNumbers: PhoneNumberRange[];
  onEdit?: (phoneNumber: PhoneNumberRange) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

export function PhoneNumberTable({
  phoneNumbers,
  onEdit,
  onDelete,
  onAdd,
}: PhoneNumberTableProps) {
  const columns: ListColumn<PhoneNumberRange>[] = useMemo(
    () => [
      { key: "start_number", header: "Start Number", sortable: true, render: (pn) => <span className="font-mono">{pn.start_number}</span> },
      { key: "stop_number", header: "Stop Number", sortable: true, render: (pn) => <span className="font-mono">{pn.stop_number}</span> },
      {
        key: "location",
        header: "Location",
        sortable: false,
        render: (pn) => (pn.location_detail ? <span>{pn.location_detail.name}</span> : <span className="text-muted-foreground">-</span>),
      },
      {
        key: "carrier",
        header: "Carrier",
        sortable: true,
        render: (pn) => (pn.carrier ? <Badge variant="outline">{pn.carrier}</Badge> : <span className="text-muted-foreground">-</span>),
      },
      {
        key: "trunk",
        header: "Trunk",
        sortable: true,
        render: (pn) => (pn.trunk ? <span className="font-mono text-sm">{pn.trunk}</span> : <span className="text-muted-foreground">-</span>),
      },
      {
        key: "number_count",
        header: "Count",
        sortable: false,
        render: (pn) => <Badge variant="secondary">{pn.number_count}</Badge>,
      },
      {
        key: "notes",
        header: "Notes",
        sortable: false,
        render: (pn) => (pn.notes ? <span className="text-sm text-muted-foreground line-clamp-1">{pn.notes}</span> : <span className="text-muted-foreground">-</span>),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (pn) => (
          <div className="flex items-center justify-end gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(pn); }}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(pn.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  return (
    <DataList<PhoneNumberRange>
      data={phoneNumbers}
      columns={columns}
      title="Phone Number Ranges"
      searchPlaceholder="Search phone numbers, carrier, trunk, location..."
      getSearchFilter={(term, pn) => {
        if (!term.trim()) return true;
        const lower = term.toLowerCase().trim();
        return (
          pn.start_number.toLowerCase().includes(lower) ||
          pn.stop_number.toLowerCase().includes(lower) ||
          (pn.carrier?.toLowerCase().includes(lower) ?? false) ||
          (pn.trunk?.toLowerCase().includes(lower) ?? false) ||
          (pn.location_detail?.name?.toLowerCase().includes(lower) ?? false) ||
          (pn.notes?.toLowerCase().includes(lower) ?? false)
        );
      }}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No phone number ranges"
      showViewToggle={false}
      headerActions={
        onAdd ? (
          <Button onClick={onAdd} size="sm" className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
            <Plus className="h-4 w-4" />
            Add Phone Number Range
          </Button>
        ) : undefined
      }
    />
  );
}
