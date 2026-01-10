"use client";

import { ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface ListViewProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
}

/**
 * ListView Component
 * Generic table/list view component for displaying data in a table format
 */
export function ListView<T extends { id?: number | string }>({
  data,
  columns,
  onSort,
  sortField,
  sortDirection,
  emptyMessage = "No items available",
  loading = false,
  loadingMessage = "Loading...",
  className,
  rowClassName,
  onRowClick,
}: ListViewProps<T>) {
  const renderSortIcon = (columnKey: string, sortable?: boolean) => {
    if (!onSort || !sortable) return null;
    
    if (sortField !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    }
    
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">{loadingMessage}</div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-left py-3 px-4",
                  column.sortable && onSort && "cursor-pointer hover:bg-[oklch(0.93_0_0)]",
                  column.headerClassName
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center">
                  {column.header}
                  {renderSortIcon(column.key, column.sortable)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={item.id ?? index}
                className={cn(
                  "border-b hover:bg-[oklch(0.98_0_0)]",
                  onRowClick && "cursor-pointer",
                  rowClassName?.(item, index)
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("py-3 px-4", column.className)}>
                    {column.render
                      ? column.render(item, index)
                      : (item as Record<string, unknown>)[column.key]?.toString() ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
