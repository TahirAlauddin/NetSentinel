/**
 * Custom hook for table sorting functionality
 * Provides reusable sorting state and handlers for table components
 */

import { useState, useCallback } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<T extends string> {
  field: T;
  direction: SortDirection;
}

interface UseTableSortOptions<T extends string> {
  /**
   * Default sort field
   */
  defaultField: T;
  /**
   * Default sort direction
   */
  defaultDirection?: SortDirection;
}

interface UseTableSortReturn<T extends string> {
  sortState: SortState<T>;
  handleSort: (field: T) => void;
  getSortIcon: (field: T) => React.ReactNode;
}

/**
 * Custom hook for table sorting
 * @param options - Configuration options
 * @returns Sort state and handlers
 */
export function useTableSort<T extends string>({
  defaultField,
  defaultDirection = "asc",
}: UseTableSortOptions<T>): UseTableSortReturn<T> {
  const [sortState, setSortState] = useState<SortState<T>>({
    field: defaultField,
    direction: defaultDirection,
  });

  const handleSort = useCallback(
    (field: T) => {
      setSortState((prev) => ({
        field,
        direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
      }));
    },
    []
  );

  const getSortIcon = useCallback(
    (field: T) => {
      if (sortState.field !== field) {
        return null; // Return null, let the component render the default icon
      }
      return sortState.direction === "asc" ? "↑" : "↓";
    },
    [sortState]
  );

  return {
    sortState,
    handleSort,
    getSortIcon,
  };
}

