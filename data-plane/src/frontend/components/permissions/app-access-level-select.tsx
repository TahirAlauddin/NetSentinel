"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PermissionRecord } from "@/types/groups";
import {
  APP_LABELS,
  APP_ORDER,
  getAppKey,
  type AppKey,
} from "@/components/permissions/permissions-by-app.constants";
import { getCatalogAccessTier } from "@/constants/app-permissions-catalog";

type PageResult<T> = {
  results: T[];
  hasMore: boolean;
};

type AccessLevel = "none" | "read" | "edit" | "admin";

type AppAccessLevelSelectProps = {
  permissions: PermissionRecord[];
  selectedPermissionIds: number[];
  setSelectedPermissionIds: (ids: number[]) => void;
  onListPermissionsPage: (page: number) => Promise<PageResult<PermissionRecord>>;
  disabled?: boolean;
};

const MANAGED_APPS: AppKey[] = APP_ORDER.filter((x) => x !== "all");

/**
 * Read All: catalog `view_*` for models in backend (see app-permissions-catalog.ts).
 * Edit All: those `view_*` plus matching `change_*` (not add_/delete_).
 * Admin: all permissions in this UI app bucket (incl. add_/delete_/unlisted codenames).
 */
function getPermissionTier(permission: PermissionRecord, app: AppKey): "read" | "edit" | "admin" {
  return getCatalogAccessTier(permission.codename, app);
}

export default function AppAccessLevelSelect({
  permissions,
  selectedPermissionIds,
  setSelectedPermissionIds,
  onListPermissionsPage,
  disabled,
}: AppAccessLevelSelectProps) {
  const [allPermissions, setAllPermissions] = useState<PermissionRecord[]>(permissions);
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    setAllPermissions((prev) => {
      const merged = new Map<number, PermissionRecord>();
      for (const row of prev) merged.set(row.id, row);
      for (const row of permissions) merged.set(row.id, row);
      return Array.from(merged.values());
    });
  }, [permissions]);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      setLoadingAll(true);
      try {
        let page = 1;
        const merged = new Map<number, PermissionRecord>();
        for (const row of allPermissions) merged.set(row.id, row);
        while (true) {
          const next = await onListPermissionsPage(page);
          for (const row of next.results) merged.set(row.id, row);
          if (!next.hasMore) break;
          page += 1;
        }
        if (!cancelled) setAllPermissions(Array.from(merged.values()));
      } finally {
        if (!cancelled) setLoadingAll(false);
      }
    };
    void loadAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onListPermissionsPage]);

  const appPermissionMap = useMemo(() => {
    const map = new Map<AppKey, PermissionRecord[]>();
    for (const app of MANAGED_APPS) map.set(app, []);
    for (const perm of allPermissions) {
      const app = getAppKey(perm);
      if (app === "all") continue;
      const current = map.get(app) ?? [];
      current.push(perm);
      map.set(app, current);
    }
    return map;
  }, [allPermissions]);

  const selectedSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);

  const getLevelForApp = (app: AppKey): AccessLevel => {
    const perms = appPermissionMap.get(app) ?? [];
    if (perms.length === 0) return "none";
    const selectedForApp = perms.filter((perm) => selectedSet.has(perm.id));
    if (selectedForApp.length === 0) return "none";
    if (selectedForApp.some((perm) => getPermissionTier(perm, app) === "admin")) return "admin";
    if (selectedForApp.some((perm) => getPermissionTier(perm, app) === "edit")) return "edit";
    return "read";
  };

  const applyLevelForApp = (app: AppKey, level: AccessLevel) => {
    const perms = appPermissionMap.get(app) ?? [];
    const appPermissionIds = new Set(perms.map((p) => p.id));
    const base = selectedPermissionIds.filter((id) => !appPermissionIds.has(id));

    if (level === "none") {
      setSelectedPermissionIds(base);
      return;
    }

    const allowed = perms.filter((perm) => {
      const tier = getPermissionTier(perm, app);
      if (level === "read") return tier === "read";
      if (level === "edit") return tier === "read" || tier === "edit";
      return true;
    });
    setSelectedPermissionIds([...base, ...allowed.map((perm) => perm.id)]);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border overflow-hidden">
        <div className="grid grid-cols-2 bg-[oklch(0.98_0_0)] px-3 py-2 text-xs font-medium">
          <span>NetSentinel App Access</span>
          <span>Permission level</span>
        </div>
        <div className="divide-y divide-border">
          {MANAGED_APPS.map((app) => (
            <div key={app} className="grid grid-cols-2 items-center gap-3 px-3 py-2">
              <span className="text-sm">{APP_LABELS[app]}</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={getLevelForApp(app)}
                disabled={disabled || loadingAll}
                onChange={(e) => applyLevelForApp(app, e.target.value as AccessLevel)}
              >
                <option value="none">None</option>
                <option value="read">Read All</option>
                <option value="edit">Edit All</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>
      {loadingAll ? (
        <div className="text-xs text-muted-foreground">Loading all permissions…</div>
      ) : null}
    </div>
  );
}

