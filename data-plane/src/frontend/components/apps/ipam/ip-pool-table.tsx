"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { IPPool } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import { DataList, type ListColumn } from "@/components/common/DataList";
import { cn } from "@/lib/utils";

interface IpPoolTableProps {
  pools: IPPool[];
  onEdit?: (pool: IPPool) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onViewUtilization?: (pool: IPPool) => void;
}

export function IpPoolTable({
  pools,
  onEdit,
  onDelete,
  onAdd,
  onViewUtilization,
}: IpPoolTableProps) {
  const columns: ListColumn<IPPool>[] = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
      {
        key: "subnet",
        header: "Subnet",
        sortable: false,
        render: (p) => p.subnet_detail?.network || p.subnet || "-",
      },
      { key: "start_ip", header: "Start IP", sortable: true, render: (p) => <span className="font-mono text-sm">{p.start_ip}</span> },
      { key: "end_ip", header: "End IP", sortable: true, render: (p) => <span className="font-mono text-sm">{p.end_ip}</span> },
      {
        key: "reservation_policy_display",
        header: "Reservation Policy",
        sortable: false,
        render: (p) => <span className="text-sm">{p.reservation_policy_display ?? "-"}</span>,
      },
      {
        key: "available_count",
        header: "Available",
        sortable: false,
        render: (p) => (p.available_count !== undefined ? <span className="font-medium">{p.available_count}</span> : "-"),
      },
      {
        key: "utilization_percentage",
        header: "Utilization",
        sortable: true,
        render: (p) =>
          p.utilization_percentage !== undefined ? (
            <div className="flex items-center gap-2">
              <div className="w-16 bg-secondary rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    p.utilization_percentage > 80 ? "bg-red-500" : p.utilization_percentage > 60 ? "bg-yellow-500" : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(p.utilization_percentage, 100)}%` }}
                />
              </div>
              <span className="text-sm">{p.utilization_percentage.toFixed(1)}%</span>
            </div>
          ) : (
            "-"
          ),
      },
      {
        key: "is_active",
        header: "Status",
        sortable: true,
        render: (p) => (
          <Badge variant={p.is_active ? "default" : "secondary"}>
            {p.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (pool) => (
          <div className="flex items-center justify-end gap-2">
            {onViewUtilization && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewUtilization(pool); }} title="View Utilization">
                Stats
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(pool); }}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(pool.id); }} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onViewUtilization]
  );

  return (
    <DataList<IPPool>
      data={pools}
      columns={columns}
      searchPlaceholder="Search pools..."
      getSearchFilter={(term, pool) => {
        if (!term.trim()) return true;
        const lower = term.toLowerCase().trim();
        return (
          pool.name.toLowerCase().includes(lower) ||
          (pool.subnet_detail?.network?.toLowerCase().includes(lower) ?? false) ||
          pool.start_ip.toLowerCase().includes(lower) ||
          pool.end_ip.toLowerCase().includes(lower) ||
          (pool.description?.toLowerCase().includes(lower) ?? false)
        );
      }}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No IP pools found"
      showViewToggle={false}
      headerActions={
        onAdd ? (
          <Button onClick={onAdd} className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
            <Plus className="h-4 w-4" />
            Add Pool
          </Button>
        ) : undefined
      }
    />
  );
}
