"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { VRF } from "@/types/ipam";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface VrfTableProps {
  vrfs: VRF[];
  onEdit?: (vrf: VRF) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

export function VrfTable({ vrfs, onEdit, onDelete, onAdd }: VrfTableProps) {
  const columns: ListColumn<VRF>[] = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true, render: (v) => <span className="font-medium">{v.name}</span> },
      { key: "rd", header: "Route Distinguisher", sortable: true, render: (v) => <span className="font-mono text-xs">{v.rd || "-"}</span> },
      { key: "description", header: "Description", sortable: true, render: (v) => v.description || "-" },
      {
        key: "location",
        header: "Location",
        sortable: false,
        render: (v) => v.location_detail?.name || "-",
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (vrf) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(vrf); }}
              className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(vrf.id); }}
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
    <DataList<VRF>
      data={vrfs}
      columns={columns}
      searchPlaceholder="Search VRFs..."
      searchKeys={["name", "rd", "description"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No VRFs available"
      showViewToggle={false}
      headerActions={
        <Button
          onClick={onAdd}
          className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]"
        >
          <Plus className="w-4 h-4" />
          Add VRF
        </Button>
      }
    />
  );
}
