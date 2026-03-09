"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { VLAN } from "@/types/ipam";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface VlanTableProps {
  vlans: VLAN[];
  onEdit?: (vlan: VLAN) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

export function VlanTable({ vlans, onEdit, onDelete, onAdd }: VlanTableProps) {
  const columns: ListColumn<VLAN>[] = useMemo(
    () => [
      { key: "vlan_id", header: "VLAN ID", sortable: true, render: (v) => <span className="font-medium">{v.vlan_id}</span> },
      { key: "name", header: "Name", sortable: true },
      { key: "description", header: "Description", sortable: true, render: (v) => v.description || "-" },
      {
        key: "location",
        header: "Location",
        sortable: true,
        render: (v) => v.location_detail?.name || "-",
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (vlan) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(vlan); }}
              className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(vlan.id); }}
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
    <DataList<VLAN>
      data={vlans}
      columns={columns}
      searchPlaceholder="Search VLANs..."
      searchKeys={["name", "vlan_id", "description"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No VLANs available"
      showViewToggle={false}
      headerActions={
        <Button
          onClick={onAdd}
          className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]"
        >
          <Plus className="w-4 h-4" />
          Add VLAN
        </Button>
      }
    />
  );
}
