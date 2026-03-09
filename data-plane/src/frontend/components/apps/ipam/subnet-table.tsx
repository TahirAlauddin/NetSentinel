"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Subnet } from "@/types/ipam";
import { DataList } from "@/components/common/DataList";
import { getSubnetListColumns, getSubnetGridItems } from "./subnet-views";

interface SubnetTableProps {
  subnets: Subnet[];
  onEdit?: (subnet: Subnet) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onFind?: () => void;
  onToggleFavorite?: (subnet: Subnet) => void;
}

function filterSubnet(term: string, subnet: Subnet): boolean {
  if (!term.trim()) return true;
  const lower = term.toLowerCase().trim();
  
  const searchFields = [
    subnet.network,
    subnet.description,
    subnet.vlan_detail ? subnet.vlan_detail.name : "",
    subnet.vrf_detail ? subnet.vrf_detail.name : "",
    subnet.customer_detail ? subnet.customer_detail.name : "",
    subnet.location_detail ? subnet.location_detail.name : "",
  ];

  return searchFields.some((field) => field && field.toLowerCase().includes(lower));
}

/**
 * SubnetTable component
 * Displays subnets using the shared DataList with table and grid views
 */
export function SubnetTable({
  subnets,
  onEdit,
  onDelete,
  onAdd,
  onFind,
  onToggleFavorite,
}: SubnetTableProps) {
  const columns = useMemo(
    () => getSubnetListColumns({ onEdit, onDelete, onToggleFavorite }),
    [onEdit, onDelete, onToggleFavorite]
  );

  const gridItems = useMemo(
    () => getSubnetGridItems({ onEdit, onDelete, onToggleFavorite }),
    [onEdit, onDelete, onToggleFavorite]
  );

  return (
    <DataList<Subnet>
      data={subnets}
      columns={columns}
      gridItems={gridItems}
      searchPlaceholder="Search subnets..."
      getSearchFilter={filterSubnet}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 18, pageSizeOptions: [10, 18, 25, 50, 100] }}
      emptyMessage="No subnets available"
      initialViewMode="list"
      gridColumns={3}
      showViewToggle
      headerActions={
        <>
          <Button
            onClick={onAdd}
            className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]"
          >
            <Plus className="w-4 h-4" />
            Add subnet
          </Button>
          <Button onClick={onFind} variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            Find subnet
          </Button>
        </>
      }
    />
  );
}
