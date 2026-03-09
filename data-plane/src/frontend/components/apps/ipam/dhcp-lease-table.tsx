"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Clock } from "lucide-react";
import { DHCPLease } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface DhcpLeaseTableProps {
  leases: DHCPLease[];
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onRelease?: (id: number) => void;
}

function formatTimeRemaining(seconds?: number) {
  if (!seconds || seconds <= 0) return "Expired";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "active": return "default";
    case "expired": return "destructive";
    case "released": return "secondary";
    case "declined": return "outline";
    default: return "secondary";
  }
}

export function DhcpLeaseTable({
  leases,
  onDelete,
  onAdd,
  onRelease,
}: DhcpLeaseTableProps) {
  const columns: ListColumn<DHCPLease>[] = useMemo(
    () => [
      { key: "ip_address", header: "IP Address", sortable: true, render: (l) => <span className="font-mono text-sm">{l.ip_address}</span> },
      { key: "mac_address", header: "MAC Address", sortable: true, render: (l) => <span className="font-mono text-sm">{l.mac_address}</span> },
      { key: "hostname", header: "Hostname", sortable: true, render: (l) => l.hostname || "-" },
      {
        key: "scope",
        header: "Scope",
        sortable: false,
        render: (l) => l.scope_detail?.name || l.scope || "-",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (l) => <Badge variant={getStatusBadgeVariant(l.status)}>{l.status_display}</Badge>,
      },
      {
        key: "time_remaining",
        header: "Time Remaining",
        sortable: true,
        render: (l) =>
          l.status === "active" ? (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTimeRemaining(l.time_remaining)}</span>
            </div>
          ) : (
            "-"
          ),
      },
      {
        key: "lease_end",
        header: "Lease End",
        sortable: true,
        render: (l) => <span className="text-sm text-muted-foreground">{new Date(l.lease_end).toLocaleString()}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (lease) => (
          <div className="flex items-center justify-end gap-2">
            {onRelease && lease.status === "active" && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRelease(lease.id); }} title="Release Lease">
                Release
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(lease.id); }} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onDelete, onRelease]
  );

  return (
    <DataList<DHCPLease>
      data={leases}
      columns={columns}
      searchPlaceholder="Search leases..."
      getSearchFilter={(term, lease) => {
        if (!term.trim()) return true;
        const lower = term.toLowerCase().trim();
        return (
          lease.ip_address.toLowerCase().includes(lower) ||
          lease.mac_address.toLowerCase().includes(lower) ||
          (lease.hostname?.toLowerCase().includes(lower) ?? false) ||
          (lease.scope_detail?.name?.toLowerCase().includes(lower) ?? false)
        );
      }}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No DHCP leases found"
      showViewToggle={false}
      headerActions={
        onAdd ? (
          <Button onClick={onAdd} className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
            <Plus className="h-4 w-4" />
            Add Lease
          </Button>
        ) : undefined
      }
    />
  );
}
