"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { SubnetGroup } from "@/types/ipam";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface SubnetGroupTableProps {
  groups: SubnetGroup[];
  onEdit?: (group: SubnetGroup) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

export function SubnetGroupTable({ groups, onEdit, onDelete, onAdd }: SubnetGroupTableProps) {
  const columns: ListColumn<SubnetGroup>[] = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true, render: (g) => <span className="font-medium">{g.name}</span> },
      { key: "description", header: "Description", sortable: true, render: (g) => g.description || "-" },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (group) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(group); }}
              className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(group.id); }}
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
    <DataList<SubnetGroup>
      data={groups}
      columns={columns}
      searchPlaceholder="Search subnet groups..."
      searchKeys={["name", "description"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No subnet groups available"
      showViewToggle={false}
      headerActions={
        <Button
          onClick={onAdd}
          className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]"
        >
          <Plus className="w-4 h-4" />
          Add Subnet Group
        </Button>
      }
    />
  );
}
