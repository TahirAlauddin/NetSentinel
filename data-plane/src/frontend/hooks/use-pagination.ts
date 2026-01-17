/**
 * Custom hook for pagination functionality
 * Provides reusable pagination state and handlers
 */

import { useState, useMemo, useCallback } from "react";

interface UsePaginationOptions {
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Number of items per page
   */
  itemsPerPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
}

/**
 * Custom hook for pagination
 * @param options - Configuration options
 * @returns Pagination state and handlers
 */
export function usePagination({
  totalItems,
  itemsPerPage = 18,
}: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );

  const endIndex = useMemo(
    () => Math.min(currentPage * itemsPerPage, totalItems),
    [currentPage, itemsPerPage, totalItems]
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    reset,
  };
}

