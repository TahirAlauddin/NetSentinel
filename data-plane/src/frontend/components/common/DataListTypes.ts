import type { ReactNode } from "react";

// Re-export column/grid types from UI so DataList works with ListView/GridView without casting
import type { Column } from "@/components/ui/list-view";
import type { GridItem } from "@/components/ui/grid-view";

export type { Column, GridItem };

/**
 * Base shape for any list item. All list data must have an id for keys and selection.
 */
export interface ListItemBase {
  id?: number | string;
}

/**
 * Column definition for table/list view (alias for ListView compatibility).
 */
export type ListColumn<T> = Column<T>;

/**
 * Grid card field definition (alias for GridView compatibility).
 */
export type ListGridItem<T> = GridItem<T>;

/**
 * Filter function: given search term and item, return true if item matches.
 */
export type ListSearchFilter<T> = (term: string, item: T) => boolean;

/**
 * Sort direction.
 */
export type ListSortDirection = "asc" | "desc";

/**
 * Pagination options.
 */
export interface ListPaginationOptions {
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}

/**
 * Props for the unified DataList component.
 */
export interface ListProps<T extends ListItemBase> {
  /** Data to display */
  data: T[];
  /** Column definitions for table view */
  columns: ListColumn<T>[];
  /** Grid/card field definitions for grid view. Omit to hide grid view or use only table. */
  gridItems?: ListGridItem<T>[];
  /** Optional title shown in the header */
  title?: string;
  /** Header actions (e.g. Add, Find buttons) */
  headerActions?: ReactNode;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Custom search filter. If not provided and searchKeys is set, default string search is used. */
  getSearchFilter?: ListSearchFilter<T>;
  /** Keys to search in when using default search (only used if getSearchFilter is not set). Values are stringified and matched. */
  searchKeys?: (keyof T)[];
  /** Enable search bar */
  searchable?: boolean;
  /** Pagination options */
  paginationOptions?: ListPaginationOptions;
  /** Enable pagination */
  pagination?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Initial view mode */
  initialViewMode?: "list" | "grid";
  /** Grid columns (1-6) when in grid view */
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Callback when a table row is clicked */
  onRowClick?: (item: T) => void;
  /** Callback when a grid card is clicked */
  onItemClick?: (item: T) => void;
  /** Optional row class for table rows */
  rowClassName?: (item: T, index: number) => string;
  /** Optional card class for grid cards */
  cardClassName?: string | ((item: T, index: number) => string);
  /** Show view toggle (list/grid). Default true if gridItems is provided. */
  showViewToggle?: boolean;
  /** Optional className for the list container card */
  className?: string;
}
