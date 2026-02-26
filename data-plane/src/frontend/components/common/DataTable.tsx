"use client";

import { cn } from "@/lib/utils";
import { ListView } from "@/components/ui/list-view";
import type { ListColumn } from "./DataListTypes";

export type { ListColumn };

export interface DataTableProps<T extends { id?: number | string }> {
  columns: ListColumn<T>[];
  data: T[];
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

/**
 * Generic table component for consistent list/table display.
 * Use with ListColumn<T>[] and data T[] for full type safety.
 */
export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  onSort,
  sortField,
  sortDirection,
  emptyMessage = "No items available",
  loading = false,
  loadingMessage = "Loading...",
  rowClassName,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-md border", className)}>
      <ListView<T>
        data={data}
        columns={columns}
        onSort={onSort}
        sortField={sortField}
        sortDirection={sortDirection}
        emptyMessage={emptyMessage}
        loading={loading}
        loadingMessage={loadingMessage}
        rowClassName={rowClassName}
        onRowClick={onRowClick}
      />
    </div>
  );
}
