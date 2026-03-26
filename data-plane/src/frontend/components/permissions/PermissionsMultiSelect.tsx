"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PermissionRecord } from "@/types/groups";

type PageResult<T> = {
  results: T[];
  hasMore: boolean;
};

export type PermissionsMultiSelectProps = {
  selectedPermissionIds: number[];
  setSelectedPermissionIds: (ids: number[]) => void;

  /** Browse (loaded/infinite scroll) data from the parent. */
  permissions: PermissionRecord[];
  hasMorePermissions?: boolean;
  loadingMorePermissions?: boolean;
  onLoadMorePermissions?: () => void | Promise<void>;

  /** Server-side search function (must query backend). */
  onSearchPermissionsPage: (query: string, page: number) => Promise<PageResult<PermissionRecord>>;
};

const BOTTOM_THRESHOLD_PX = 72;
const SEARCH_DEBOUNCE_MS = 450;

export default function PermissionsMultiSelect({
  selectedPermissionIds,
  setSelectedPermissionIds,
  permissions,
  hasMorePermissions,
  loadingMorePermissions,
  onLoadMorePermissions,
  onSearchPermissionsPage,
}: PermissionsMultiSelectProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const [queryDraft, setQueryDraft] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PermissionRecord[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);

  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectAllModeRef = useRef(false);
  const deselectedIdsRef = useRef<Set<number>>(new Set());

  const isSearching = activeQuery.trim().length > 0;
  const displayedPermissions = isSearching ? searchResults : permissions;

  const displayedIdSet = useMemo(() => {
    return new Set(displayedPermissions.map((p) => p.id));
  }, [displayedPermissions]);

  const allDisplayedSelected =
    displayedPermissions.length > 0 &&
    displayedPermissions.every((p) => selectedPermissionIds.includes(p.id));

  const someDisplayedSelected =
    displayedPermissions.length > 0 &&
    displayedPermissions.some((p) => selectedPermissionIds.includes(p.id));

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someDisplayedSelected && !allDisplayedSelected;
  }, [allDisplayedSelected, someDisplayedSelected]);

  // Reset select-all mode when switching the list/query source.
  useEffect(() => {
    selectAllModeRef.current = false;
    deselectedIdsRef.current = new Set();
  }, [activeQuery, isSearching]);

  // If select-all mode is enabled, auto-select newly loaded items
  // (except for specific permissions the user manually deselected).
  useEffect(() => {
    if (!selectAllModeRef.current) return;
    const idsToSelect = displayedPermissions
      .map((p) => p.id)
      .filter((id) => !deselectedIdsRef.current.has(id));
    if (idsToSelect.length === 0) return;

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToSelect) next.add(id);
      return Array.from(next);
    });
  }, [displayedPermissions, setSelectedPermissionIds]);

  const groupedPermissions = useMemo(() => {
    const acc = {} as Record<number, PermissionRecord[]>;
    for (const perm of displayedPermissions) {
      const key = perm.content_type || 0;
      acc[key] ||= [];
      acc[key].push(perm);
    }
    return acc;
  }, [displayedPermissions]);

  const resetSearch = async (nextQuery: string) => {
    const q = nextQuery.trim();
    setActiveQuery(q);
    setSearchResults([]);
    setSearchPage(1);
    setSearchHasMore(false);

    if (!q) return;

    setSearchLoading(true);
    try {
      const page1 = await onSearchPermissionsPage(q, 1);
      setSearchResults(page1.results);
      setSearchHasMore(page1.hasMore);
      setSearchPage(2);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search: when the user pauses typing, fetch from backend.
  useEffect(() => {
    const t = setTimeout(() => {
      // Allow immediate switch back to browse mode.
      void resetSearch(queryDraft);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryDraft]);

  const loadMoreSearch = async () => {
    if (!isSearching) return;
    if (!searchHasMore || searchLoadingMore || searchLoading) return;
    setSearchLoadingMore(true);
    try {
      const next = await onSearchPermissionsPage(activeQuery, searchPage);
      setSearchResults((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const row of next.results) {
          if (!seen.has(row.id)) merged.push(row);
        }
        return merged;
      });
      setSearchHasMore(next.hasMore);
      setSearchPage((p) => p + 1);
    } finally {
      setSearchLoadingMore(false);
    }
  };

  const loadMoreBrowse = async () => {
    if (isSearching) return;
    if (!hasMorePermissions || loadingMorePermissions) return;
    if (!onLoadMorePermissions) return;
    await onLoadMorePermissions();
  };

  const onScroll = () => {
    const root = scrollRootRef.current;
    if (!root) return;

    if (root.scrollHeight - root.scrollTop - root.clientHeight > BOTTOM_THRESHOLD_PX) return;

    if (isSearching) {
      void loadMoreSearch();
      return;
    }

    void loadMoreBrowse();
  };

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, activeQuery, hasMorePermissions, loadingMorePermissions, searchHasMore, searchLoading, searchLoadingMore]);

  const toggleSelectAllDisplayed = (checked: boolean) => {
    if (checked) {
      selectAllModeRef.current = true;
      deselectedIdsRef.current = new Set();
      const next = new Set(selectedPermissionIds);
      for (const id of displayedIdSet) next.add(id);
      setSelectedPermissionIds(Array.from(next));
      return;
    }

    selectAllModeRef.current = false;
    deselectedIdsRef.current = new Set();
    setSelectedPermissionIds(selectedPermissionIds.filter((id) => !displayedIdSet.has(id)));
  };

  const togglePermission = (permissionId: number) => {
    if (selectedPermissionIds.includes(permissionId)) {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== permissionId));
      if (selectAllModeRef.current) deselectedIdsRef.current.add(permissionId);
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, permissionId]);
      if (selectAllModeRef.current) deselectedIdsRef.current.delete(permissionId);
    }
  };

  const emptyStateText = isSearching
    ? queryDraft.trim()
      ? "No permissions match your search"
      : "Type to search permissions"
    : "No permissions available";

  return (
    <div className="space-y-2">
      <div className="space-y-2">
      <div className="flex items-center gap-2">
          <input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void resetSearch(queryDraft);
            }}
            placeholder="Search permissions (name/codename)..."
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
          {queryDraft.trim() ? (
            <button
              type="button"
              onClick={() => void resetSearch(queryDraft)}
              className="h-9 px-3 rounded-md border border-border bg-background hover:bg-[oklch(0.98_0_0)] text-xs"
            >
              Search
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allDisplayedSelected}
            onChange={(e) => toggleSelectAllDisplayed(e.target.checked)}
            className="rounded border-input"
            disabled={displayedPermissions.length === 0}
          />
          <span className="text-xs text-muted-foreground">Select all</span>
        </div>
      </div>

      <div
        ref={scrollRootRef}
        className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-background"
      >
        {displayedPermissions.length > 0 ? (
          <>
            {Object.entries(groupedPermissions).map(([contentType, perms]) => (
              <div key={contentType} className="space-y-1">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[oklch(0.98_0_0)] p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissionIds.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded border-input"
                    />
                    <span className="text-xs">{perm.name}</span>
                  </label>
                ))}
              </div>
            ))}
            {isSearching ? (
              searchHasMore ? (
                <div className="text-xs text-muted-foreground text-center py-2 min-h-[1.5rem]" aria-hidden>
                  {searchLoadingMore ? "Loading more…" : ""}
                </div>
              ) : null
            ) : (
              hasMorePermissions ? (
                <div className="text-xs text-muted-foreground text-center py-2 min-h-[1.5rem]" aria-hidden>
                  {loadingMorePermissions ? "Loading more…" : ""}
                </div>
              ) : null
            )}
          </>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">{emptyStateText}</div>
        )}
      </div>
    </div>
  );
}

