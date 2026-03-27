"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PermissionRecord } from "@/types/groups";
import {
  APP_LABELS,
  APP_ORDER,
  BOTTOM_THRESHOLD_PX,
  getAppKey,
  SEARCH_DEBOUNCE_MS,
  type AppKey,
  VERB_PREFIXES,
} from "@/components/permissions/permissions-by-app.constants";

type PageResult<T> = {
  results: T[];
  hasMore: boolean;
};

export type PermissionsByAppSelectProps = {
  selectedPermissionIds: number[];
  setSelectedPermissionIds: (ids: number[]) => void;
  permissions: PermissionRecord[];
  onListPermissionsPage: (page: number) => Promise<PageResult<PermissionRecord>>;
  hasMorePermissions?: boolean;
  loadingMorePermissions?: boolean;
  onLoadMorePermissions?: () => void | Promise<void>;
  onSearchPermissionsPage: (query: string, page: number) => Promise<PageResult<PermissionRecord>>;
};

function getResourceKey(permission: PermissionRecord): string {
  const bits = permission.codename.toLowerCase().split("_").filter(Boolean);
  if (bits.length <= 1) return permission.codename.toLowerCase();
  if (VERB_PREFIXES.has(bits[0])) return bits.slice(1).join("_");
  return bits.join("_");
}

export default function PermissionsByAppSelect({
  selectedPermissionIds,
  setSelectedPermissionIds,
  permissions,
  onListPermissionsPage,
  hasMorePermissions,
  loadingMorePermissions,
  onLoadMorePermissions,
  onSearchPermissionsPage,
}: PermissionsByAppSelectProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [activeApp, setActiveApp] = useState<AppKey>("all");
  const [queryDraft, setQueryDraft] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PermissionRecord[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [allPermissions, setAllPermissions] = useState<PermissionRecord[]>(permissions);
  const [loadingAllPermissions, setLoadingAllPermissions] = useState(false);
  const [hasLoadedAllPermissions, setHasLoadedAllPermissions] = useState(false);

  const isSearching = activeQuery.trim().length > 0;
  const sourcePermissions = isSearching ? searchResults : allPermissions;

  useEffect(() => {
    setAllPermissions((prev) => {
      const merged = new Map<number, PermissionRecord>();
      for (const row of prev) merged.set(row.id, row);
      for (const row of permissions) merged.set(row.id, row);
      return Array.from(merged.values());
    });
  }, [permissions]);

  const appFilteredPermissions = useMemo(() => {
    if (activeApp === "all") return sourcePermissions;
    return sourcePermissions.filter((perm) => getAppKey(perm) === activeApp);
  }, [activeApp, sourcePermissions]);

  const groupedPermissions = useMemo(() => {
    const acc: Record<string, PermissionRecord[]> = {};
    for (const perm of appFilteredPermissions) {
      const key = getResourceKey(perm);
      acc[key] ||= [];
      acc[key].push(perm);
    }
    return Object.entries(acc).sort((a, b) => a[0].localeCompare(b[0]));
  }, [appFilteredPermissions]);

  const ensureAllPermissionsLoaded = async () => {
    if (hasLoadedAllPermissions || loadingAllPermissions) return;
    setLoadingAllPermissions(true);
    try {
      let page = 1;
      const merged = new Map<number, PermissionRecord>();
      for (const row of allPermissions) merged.set(row.id, row);

      while (true) {
        const nextPage = await onListPermissionsPage(page);
        for (const row of nextPage.results) merged.set(row.id, row);
        if (!nextPage.hasMore) break;
        page += 1;
      }

      setAllPermissions(Array.from(merged.values()));
      setHasLoadedAllPermissions(true);
    } finally {
      setLoadingAllPermissions(false);
    }
  };

  const allDisplayedSelected =
    appFilteredPermissions.length > 0 &&
    appFilteredPermissions.every((p) => selectedPermissionIds.includes(p.id));
  const someDisplayedSelected =
    appFilteredPermissions.length > 0 &&
    appFilteredPermissions.some((p) => selectedPermissionIds.includes(p.id));

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someDisplayedSelected && !allDisplayedSelected;
  }, [allDisplayedSelected, someDisplayedSelected]);

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

  useEffect(() => {
    const t = setTimeout(() => {
      void resetSearch(queryDraft);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryDraft]);

  const loadMoreSearch = async () => {
    if (!isSearching || !searchHasMore || searchLoadingMore || searchLoading) return;
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
    if (isSearching || !hasMorePermissions || loadingMorePermissions || !onLoadMorePermissions) return;
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
    const displayedIds = new Set(appFilteredPermissions.map((p) => p.id));
    if (checked) {
      const next = new Set(selectedPermissionIds);
      for (const id of displayedIds) next.add(id);
      setSelectedPermissionIds(Array.from(next));
      return;
    }
    setSelectedPermissionIds(selectedPermissionIds.filter((id) => !displayedIds.has(id)));
  };

  const togglePermission = (permissionId: number) => {
    if (selectedPermissionIds.includes(permissionId)) {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== permissionId));
      return;
    }
    setSelectedPermissionIds([...selectedPermissionIds, permissionId]);
  };

  const emptyStateText = isSearching
    ? queryDraft.trim()
      ? "No permissions match your search in this app"
      : "Type to search permissions"
    : "No permissions available for this app";

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {APP_ORDER.map((appKey) => (
            <button
              key={appKey}
              type="button"
              onClick={() => {
                setActiveApp(appKey);
                if (appKey !== "all") {
                  void ensureAllPermissionsLoaded();
                }
              }}
              className={[
                "h-8 px-3 rounded-md border text-xs transition-colors",
                activeApp === appKey
                  ? "border-[oklch(0.52_0.2_22)] bg-[oklch(0.96_0.02_22)] text-[oklch(0.40_0.15_249)]"
                  : "border-border bg-background hover:bg-[oklch(0.98_0_0)] text-muted-foreground",
              ].join(" ")}
            >
              {APP_LABELS[appKey]}
            </button>
          ))}
        </div>

        {activeApp !== "all" && loadingAllPermissions && !isSearching ? (
          <div className="text-xs text-muted-foreground">
            Loading all permissions for {APP_LABELS[activeApp]}...
          </div>
        ) : null}

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
            disabled={appFilteredPermissions.length === 0}
          />
          <span className="text-xs text-muted-foreground">Select all in this app</span>
        </div>
      </div>

      <div
        ref={scrollRootRef}
        className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-3 bg-background"
      >
        {appFilteredPermissions.length > 0 ? (
          <>
            {groupedPermissions.map(([resource, perms]) => (
              <div key={resource} className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-1">
                  {resource}
                </div>
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
            ) : hasMorePermissions ? (
              <div className="text-xs text-muted-foreground text-center py-2 min-h-[1.5rem]" aria-hidden>
                {loadingMorePermissions ? "Loading more…" : ""}
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">{emptyStateText}</div>
        )}
      </div>
    </div>
  );
}

