"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { ListView } from "@/components/ui/list-view";
import { GridView } from "@/components/ui/grid-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListItemBase, ListProps, ListSortDirection } from "./DataListTypes";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

/**
 * Default search: match term against stringified values of the given keys.
 */
function defaultSearchFilter<T extends ListItemBase>(
  term: string,
  item: T,
  keys: (keyof T)[]
): boolean {
  if (!term.trim()) return true;
  const lower = term.toLowerCase().trim();
  return keys.some((key) => {
    const value = item[key];
    if (value == null) return false;
    return String(value).toLowerCase().includes(lower);
  });
}

/**
 * Generic comparison for sorting (handles string, number, Date).
 */
function compareValues(a: unknown, b: unknown, direction: ListSortDirection): number {
  const aVal = a instanceof Date ? a.getTime() : a;
  const bVal = b instanceof Date ? b.getTime() : b;
  const aNum = typeof aVal === "number" ? aVal : Number(aVal);
  const bNum = typeof bVal === "number" ? bVal : Number(bVal);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return direction === "asc" ? aNum - bNum : bNum - aNum;
  }
  const aStr = String(aVal ?? "");
  const bStr = String(bVal ?? "");
  const cmp = aStr.localeCompare(bStr, undefined, { sensitivity: "base" });
  return direction === "asc" ? cmp : -cmp;
}

export function DataList<T extends ListItemBase>({
  data,
  columns,
  gridItems = [],
  title,
  headerActions,
  searchPlaceholder = "Search",
  getSearchFilter,
  searchKeys,
  searchable = true,
  paginationOptions = {},
  pagination = true,
  emptyMessage = "No items available",
  loading = false,
  loadingMessage = "Loading...",
  initialViewMode = "list",
  gridColumns = 3,
  onRowClick,
  onItemClick,
  rowClassName,
  cardClassName,
  showViewToggle,
  className,
}: ListProps<T>) {
  const {
    pageSizeOptions = DEFAULT_PAGE_SIZES,
    defaultPageSize = DEFAULT_PAGE_SIZE,
  } = paginationOptions;

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize);
  const [sortField, setSortField] = useState<string | null>(() => {
    const firstSortable = columns.find((c) => c.sortable);
    return firstSortable?.key ?? null;
  });
  const [sortDirection, setSortDirection] = useState<ListSortDirection>("asc");

  const canShowViewToggle = showViewToggle ?? gridItems.length > 0;

  const filterFn = useCallback(
    (item: T): boolean => {
      if (getSearchFilter) return getSearchFilter(searchTerm, item);
      if (searchKeys?.length) return defaultSearchFilter(searchTerm, item, searchKeys);
      return true;
    },
    [searchTerm, getSearchFilter, searchKeys]
  );

  const filteredData = useMemo(() => {
    return data.filter(filterFn);
  }, [data, filterFn]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortField];
      const bVal = (b as Record<string, unknown>)[sortField];
      return compareValues(aVal, bVal, sortDirection);
    });
  }, [filteredData, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (pageIndex - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, pagination, pageIndex, itemsPerPage]);

  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  const startItem = (pageIndex - 1) * itemsPerPage + 1;
  const endItem = Math.min(pageIndex * itemsPerPage, sortedData.length);
  const hasPagination = pagination && sortedData.length > itemsPerPage;

  return (
    <Card className={cn("p-6", className)}>
      {/* Header: title + actions */}
      {(title != null || headerActions != null) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {title != null && (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          )}
          {headerActions != null && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Toolbar: search, view toggle, per page */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {searchable && (
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full sm:w-64"
                aria-label="Search"
              />
            </div>
          )}
          {canShowViewToggle && (
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          )}
        </div>
        {pagination && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Per page</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Content: table or grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{loadingMessage}</div>
      ) : viewMode === "list" ? (
        <div className="overflow-x-auto rounded-md border">
          <ListView<T>
            data={paginatedData}
            columns={columns}
            onSort={handleSort}
            sortField={sortField ?? undefined}
            sortDirection={sortDirection}
            emptyMessage={emptyMessage}
            rowClassName={rowClassName}
            onRowClick={onRowClick}
          />
        </div>
      ) : gridItems.length > 0 ? (
        <GridView<T>
          data={paginatedData}
          items={gridItems}
          columns={gridColumns}
          emptyMessage={emptyMessage}
          cardClassName={cardClassName}
          onItemClick={onItemClick}
        />
      ) : (
        <ListView<T>
          data={paginatedData}
          columns={columns}
          onSort={handleSort}
          sortField={sortField ?? undefined}
          sortDirection={sortDirection}
          emptyMessage={emptyMessage}
          rowClassName={rowClassName}
          onRowClick={onRowClick}
        />
      )}

      {/* Pagination bar */}
      {hasPagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {startItem} to {endItem} of {sortedData.length} items
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pageIndex <= 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              Page {pageIndex} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageIndex >= totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default DataList;
export type { ListProps, ListColumn, ListGridItem, ListItemBase } from "./DataListTypes";
