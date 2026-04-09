import { useCallback, useEffect, useRef, useState } from "react";

/** Standard shape returned by a DRF-style `?page=` endpoint. */
export type PaginatedFetchResult<T> = {
  results: T[];
  hasMore: boolean;
};

export type UsePaginatedAppendOptions<T> = {
  fetchPage: (page: number) => Promise<PaginatedFetchResult<T>>;
  /** Extract a unique key per item for dedup. Default: `item.id`. */
  getItemKey?: (item: T) => string | number;
  /** Called when `loadMore` fails (e.g. show a toast). */
  onLoadMoreError?: (error: unknown) => void;
};

export type UsePaginatedAppendReturn<T> = {
  items: T[];
  hasMore: boolean;
  loadingMore: boolean;
  /** Apply the first page (resets pagination to page 2). */
  setFirstPage: (page: PaginatedFetchResult<T>) => void;
  /** Fetch the next page and append. Safe to call from scroll handlers — guarded internally. */
  loadMore: () => Promise<void>;
  /** Clear everything back to the empty state. */
  reset: () => void;
};

function defaultGetItemKey<T>(item: T): string | number {
  if (item !== null && typeof item === "object" && "id" in item) {
    return (item as { id: string | number }).id;
  }
  throw new Error("usePaginatedAppend: provide getItemKey when items have no `id` field");
}

/**
 * Accumulate paginated results for infinite-scroll / "load more" UIs.
 *
 * `loadMore` is **always the same function reference** (zero deps) so it's
 * safe to capture in scroll handlers or IntersectionObservers without
 * worrying about stale closures.
 */
export function usePaginatedAppend<T>(
  options: UsePaginatedAppendOptions<T>,
): UsePaginatedAppendReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // All mutable values live in refs so loadMore can have [] deps.
  const nextPageRef = useRef(2);
  const hasMoreRef = useRef(false);
  const loadLocked = useRef(false);
  const fetchPageRef = useRef(options.fetchPage);
  const getItemKeyRef = useRef(options.getItemKey ?? defaultGetItemKey);
  const onErrorRef = useRef(options.onLoadMoreError);

  useEffect(() => {
    fetchPageRef.current = options.fetchPage;
    getItemKeyRef.current = options.getItemKey ?? defaultGetItemKey;
    onErrorRef.current = options.onLoadMoreError;
  }, [options.fetchPage, options.getItemKey, options.onLoadMoreError]);

  const setFirstPage = useCallback((page: PaginatedFetchResult<T>) => {
    setItems(page.results);
    setHasMore(page.hasMore);
    hasMoreRef.current = page.hasMore;
    nextPageRef.current = 2;
    loadLocked.current = false;
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setHasMore(false);
    hasMoreRef.current = false;
    nextPageRef.current = 2;
    setLoadingMore(false);
    loadLocked.current = false;
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadLocked.current) return;
    loadLocked.current = true;
    setLoadingMore(true);

    const pageNum = nextPageRef.current;
    try {
      const page = await fetchPageRef.current(pageNum);
      nextPageRef.current = pageNum + 1;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
      setItems((prev) => {
        const keyFn = getItemKeyRef.current;
        const seen = new Set(prev.map(keyFn));
        const merged = [...prev];
        for (const row of page.results) {
          if (!seen.has(keyFn(row))) {
            merged.push(row);
          }
        }
        return merged;
      });
    } catch (error) {
      console.error("usePaginatedAppend loadMore failed:", error);
      onErrorRef.current?.(error);
    } finally {
      setLoadingMore(false);
      loadLocked.current = false;
    }
  }, []);

  return { items, hasMore, loadingMore, setFirstPage, loadMore, reset };
}
