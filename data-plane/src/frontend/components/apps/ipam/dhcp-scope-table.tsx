"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Activity } from "lucide-react";
import { DHCPScope } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface DhcpScopeTableProps {
  scopes: DHCPScope[];
  onEdit?: (scope: DHCPScope) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onViewLeases?: (scope: DHCPScope) => void;
  onViewReservations?: (scope: DHCPScope) => void;
}

export function DhcpScopeTable({
  scopes,
  onEdit,
  onDelete,
  onAdd,
  onViewLeases,
  onViewReservations,
}: DhcpScopeTableProps) {
  const columns: ListColumn<DHCPScope>[] = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
      {
        key: "subnet",
        header: "Subnet",
        sortable: false,
        render: (s) => s.subnet_detail?.network || s.subnet || "-",
      },
      { key: "start_ip", header: "Start IP", sortable: true, render: (s) => <span className="font-mono text-sm">{s.start_ip}</span> },
      { key: "end_ip", header: "End IP", sortable: true, render: (s) => <span className="font-mono text-sm">{s.end_ip}</span> },
      {
        key: "lease_duration",
        header: "Lease Duration",
        sortable: false,
        render: (s) => (s.lease_duration ? `${Math.floor(s.lease_duration / 3600)}h` : "-"),
      },
      {
        key: "active_leases_count",
        header: "Active Leases",
        sortable: true,
        render: (s) => (
          <div className="flex items-center gap-2">
            <span>{s.active_leases_count ?? 0}</span>
            {onViewLeases && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewLeases(s); }} className="h-6 px-2">
                <Activity className="h-3 w-3" />
              </Button>
            )}
          </div>
        ),
      },
      {
        key: "available_ips",
        header: "Available",
        sortable: false,
        render: (s) => (s.available_ips !== undefined ? <span className="font-medium">{s.available_ips}</span> : "-"),
      },
      {
        key: "is_active",
        header: "Status",
        sortable: true,
        render: (s) => (
          <Badge variant={s.is_active ? "default" : "secondary"}>
            {s.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (scope) => (
          <div className="flex items-center justify-end gap-2">
            {onViewReservations && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewReservations(scope); }} title="View Reservations">
                Reservations
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(scope); }}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(scope.id); }} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onViewLeases, onViewReservations]
  );

  return (
    <DataList<DHCPScope>
      data={scopes}
      columns={columns}
      searchPlaceholder="Search scopes..."
      getSearchFilter={(term, scope) => {
        if (!term.trim()) return true;
        const lower = term.toLowerCase().trim();
        return (
          scope.name.toLowerCase().includes(lower) ||
          (scope.subnet_detail?.network?.toLowerCase().includes(lower) ?? false) ||
          scope.start_ip.toLowerCase().includes(lower) ||
          scope.end_ip.toLowerCase().includes(lower) ||
          (scope.description?.toLowerCase().includes(lower) ?? false)
        );
      }}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No DHCP scopes found"
      showViewToggle={false}
      headerActions={
        onAdd ? (
          <Button onClick={onAdd} className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
            <Plus className="h-4 w-4" />
            Add Scope
          </Button>
        ) : undefined
      }
    />
  );
}
