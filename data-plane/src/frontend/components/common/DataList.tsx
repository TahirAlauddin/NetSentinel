"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import type { ViewMode } from "@/components/ui/view-toggle";
import type { ListItemBase, ListProps, ListSortDirection } from "./DataListTypes";
import { cn } from "@/lib/utils";

import { DataListContent } from "./DataListContent";
import { DataListHeader } from "./DataListHeader";
import { DataListToolbar } from "./DataListToolbar";
import { DataListPaginationControls } from "./DataListPaginationControls";

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
      <DataListHeader title={title} headerActions={headerActions} />

      <DataListToolbar
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        canShowViewToggle={canShowViewToggle}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pagination={pagination}
        itemsPerPage={itemsPerPage}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />

      <DataListContent<T>
        loading={loading}
        loadingMessage={loadingMessage}
        viewMode={viewMode}
        gridItems={gridItems}
        paginatedData={paginatedData}
        columns={columns}
        gridColumns={gridColumns}
        emptyMessage={emptyMessage}
        cardClassName={cardClassName}
        rowClassName={rowClassName}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        onRowClick={onRowClick}
        onItemClick={onItemClick}
      />

      <DataListPaginationControls
        hasPagination={hasPagination}
        startItem={startItem}
        endItem={endItem}
        totalItems={sortedData.length}
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      />
    </Card>
  );
}

export default DataList;
export type { ListProps, ListColumn, ListGridItem, ListItemBase } from "./DataListTypes";
