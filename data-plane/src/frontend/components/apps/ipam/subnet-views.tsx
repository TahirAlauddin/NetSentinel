"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Edit2, Trash2, Star } from "lucide-react";
import { Subnet, SubnetSortOptions } from "@/types/ipam";
import { ListView, Column } from "@/components/ui/list-view";
import { GridView, GridItem } from "@/components/ui/grid-view";
import { ViewMode } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";

export interface SubnetListCallbacks {
  onEdit?: (subnet: Subnet) => void;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (subnet: Subnet) => void;
}

/**
 * Build subnet table columns for use with DataList or ListView.
 */
export function getSubnetListColumns({
  onEdit,
  onDelete,
  onToggleFavorite,
}: SubnetListCallbacks): Column<Subnet>[] {
  return [
    {
      key: "network",
      header: "Subnet",
      sortable: true,
      render: (subnet) => (
        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(subnet);
              }}
              className={cn(
                "p-1 rounded transition-colors",
                subnet.is_favorite
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-muted-foreground hover:text-yellow-500"
              )}
              title={subnet.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  subnet.is_favorite && "fill-current"
                )}
              />
            </button>
          )}
          <Link
            href={`/ipam/subnets/${subnet.id}`}
            className="font-mono text-sm text-[oklch(0.40_0.15_249)] hover:underline"
          >
            {subnet.network}
          </Link>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      render: (subnet) => subnet.description || "/",
    },
    {
      key: "vlan",
      header: "VLAN",
      sortable: true,
      render: (subnet) =>
        subnet.vlan_detail ? (
          <span>{subnet.vlan_detail.vlan_id || subnet.vlan_detail.name}</span>
        ) : (
          <span className="text-muted-foreground">Default</span>
        ),
    },
    {
      key: "vrf",
      header: "VRF",
      sortable: true,
      render: (subnet) =>
        subnet.vrf_detail ? (
          <span>{subnet.vrf_detail.name}</span>
        ) : (
          <span className="text-muted-foreground">Default</span>
        ),
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      render: (subnet) =>
        subnet.customer_detail ? (
          <span>{subnet.customer_detail.name}</span>
        ) : (
          <span className="text-muted-foreground">/</span>
        ),
    },
    {
      key: "location",
      header: "Subnet Location",
      sortable: true,
      render: (subnet) =>
        subnet.location_detail ? (
          <span>{subnet.location_detail.name}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Routable",
      sortable: true,
      render: (subnet) =>
        subnet.status === "active" ? (
          <span className="text-green-600">Yes</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (subnet) => (
        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(subnet);
              }}
              className={cn(
                "p-1 rounded transition-colors",
                subnet.is_favorite
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-muted-foreground hover:text-yellow-500"
              )}
              title={subnet.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  subnet.is_favorite && "fill-current"
                )}
              />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(subnet);
            }}
            className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(subnet.id);
            }}
            className="p-1 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];
}

/**
 * Build subnet grid items for use with DataList or GridView.
 */
export function getSubnetGridItems({
  onEdit,
  onDelete,
  onToggleFavorite,
}: SubnetListCallbacks): GridItem<Subnet>[] {
  return [
    {
      key: "network",
      label: "Subnet",
      render: (subnet) => (
        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(subnet);
              }}
              className={cn(
                "p-1 rounded transition-colors",
                subnet.is_favorite
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-muted-foreground hover:text-yellow-500"
              )}
              title={subnet.is_favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  subnet.is_favorite && "fill-current"
                )}
              />
            </button>
          )}
          <Link
            href={`/ipam/subnets/${subnet.id}`}
            className="font-mono text-base font-semibold text-[oklch(0.40_0.15_249)] hover:underline"
          >
            {subnet.network}
          </Link>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (subnet) => (
        <div className="text-sm">{subnet.description || "No description"}</div>
      ),
    },
    {
      key: "details",
      render: (subnet) => (
        <div className="space-y-1 text-xs text-muted-foreground">
          {subnet.vlan_detail && (
            <div>
              <span className="font-medium">VLAN:</span> {subnet.vlan_detail.vlan_id || subnet.vlan_detail.name}
            </div>
          )}
          {subnet.vrf_detail && (
            <div>
              <span className="font-medium">VRF:</span> {subnet.vrf_detail.name}
            </div>
          )}
          {subnet.customer_detail && (
            <div>
              <span className="font-medium">Customer:</span> {subnet.customer_detail.name}
            </div>
          )}
          {subnet.location_detail && (
            <div>
              <span className="font-medium">Location:</span> {subnet.location_detail.name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      render: (subnet) => (
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            {subnet.status === "active" ? (
              <span className="text-xs text-green-600 font-medium">Active</span>
            ) : (
              <span className="text-xs text-muted-foreground">{subnet.status_display}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(subnet);
                }}
                className={cn(
                  "p-1 rounded transition-colors",
                  subnet.is_favorite
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-muted-foreground hover:text-yellow-500"
                )}
                title={subnet.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star
                  className={cn(
                    "w-3 h-3",
                    subnet.is_favorite && "fill-current"
                  )}
                />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(subnet);
              }}
              className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
              title="Edit"
            >
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(subnet.id);
              }}
              className="p-1 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>
      ),
    },
  ];
}

interface SubnetViewsProps {
  subnets: Subnet[];
  viewMode: ViewMode;
  sortOptions: SubnetSortOptions;
  onSort: (field: SubnetSortOptions["field"]) => void;
  onEdit?: (subnet: Subnet) => void;
  onDelete?: (id: number) => void;
  onToggleFavorite?: (subnet: Subnet) => void;
  emptyMessage?: string;
}

/**
 * SubnetViews Component
 * Displays subnets in either list or grid view using reusable components
 */
export function SubnetViews({
  subnets,
  viewMode,
  sortOptions,
  onSort,
  onEdit,
  onDelete,
  onToggleFavorite,
  emptyMessage = "No subnets available",
}: SubnetViewsProps) {
  const listColumns: Column<Subnet>[] = useMemo(
    () => getSubnetListColumns({ onEdit, onDelete, onToggleFavorite }),
    [onEdit, onDelete, onToggleFavorite]
  );

  const gridItems: GridItem<Subnet>[] = useMemo(
    () => getSubnetGridItems({ onEdit, onDelete, onToggleFavorite }),
    [onEdit, onDelete, onToggleFavorite]
  );

  const handleSort = (field: string) => {
    onSort(field as SubnetSortOptions["field"]);
  };

  if (viewMode === "list") {
    return (
      <ListView
        data={subnets}
        columns={listColumns}
        onSort={handleSort}
        sortField={sortOptions.field}
        sortDirection={sortOptions.direction}
        emptyMessage={emptyMessage}
      />
    );
  }

  return (
    <GridView
      data={subnets}
      items={gridItems}
      columns={3}
      emptyMessage={emptyMessage}
    />
  );
}
