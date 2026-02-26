"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { DHCPReservation } from "@/types/ipam";
import { Badge } from "@/components/ui/badge";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface DhcpReservationTableProps {
  reservations: DHCPReservation[];
  onEdit?: (reservation: DHCPReservation) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
}

export function DhcpReservationTable({
  reservations,
  onEdit,
  onDelete,
  onAdd,
}: DhcpReservationTableProps) {
  const columns: ListColumn<DHCPReservation>[] = useMemo(
    () => [
      { key: "ip_address", header: "IP Address", sortable: true, render: (r) => <span className="font-mono text-sm">{r.ip_address}</span> },
      { key: "mac_address", header: "MAC Address", sortable: true, render: (r) => <span className="font-mono text-sm">{r.mac_address}</span> },
      { key: "hostname", header: "Hostname", sortable: true, render: (r) => r.hostname || "-" },
      { key: "description", header: "Description", sortable: false, render: (r) => <span className="text-sm text-muted-foreground">{r.description || "-"}</span> },
      {
        key: "is_active",
        header: "Status",
        sortable: true,
        render: (r) => (
          <Badge variant={r.is_active ? "default" : "secondary"}>
            {r.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        render: (reservation) => (
          <div className="flex items-center justify-end gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(reservation); }}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(reservation.id); }} className="text-red-600 hover:text-red-700">
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
    <DataList<DHCPReservation>
      data={reservations}
      columns={columns}
      searchPlaceholder="Search reservations..."
      searchKeys={["ip_address", "mac_address", "hostname"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No DHCP reservations found"
      showViewToggle={false}
      headerActions={
        onAdd ? (
          <Button onClick={onAdd} className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
            <Plus className="h-4 w-4" />
            Add Reservation
          </Button>
        ) : undefined
      }
    />
  );
}
