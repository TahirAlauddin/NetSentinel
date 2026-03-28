"use client";

import React, { useState } from "react";
import { PermissionRecord } from "@/types/groups";
import AppAccessLevelSelect from "@/components/permissions/app-access-level-select";
import PermissionsByAppSelect from "@/components/permissions/PermissionsByAppSelect";

type PageResult<T> = {
  results: T[];
  hasMore: boolean;
};

type PermissionManagementPanelProps = {
  permissions: PermissionRecord[];
  selectedPermissionIds: number[];
  setSelectedPermissionIds: (ids: number[]) => void;
  onListPermissionsPage: (page: number) => Promise<PageResult<PermissionRecord>>;
  onSearchPermissionsPage: (query: string, page: number) => Promise<PageResult<PermissionRecord>>;
  hasMorePermissions?: boolean;
  loadingMorePermissions?: boolean;
  onLoadMorePermissions?: () => void | Promise<void>;

  title?: string;
  description?: string;
  showAtomicToggle?: boolean;
  atomicDefaultOpen?: boolean;
  disabled?: boolean;
};

export default function PermissionManagementPanel({
  permissions,
  selectedPermissionIds,
  setSelectedPermissionIds,
  onListPermissionsPage,
  onSearchPermissionsPage,
  hasMorePermissions,
  loadingMorePermissions,
  onLoadMorePermissions,
  title = "Permission Management",
  description = "Assign app-level access first. Enable atomic permissions only for advanced exceptions.",
  showAtomicToggle = true,
  atomicDefaultOpen = false,
  disabled = false,
}: PermissionManagementPanelProps) {
  const [showAtomic, setShowAtomic] = useState(atomicDefaultOpen);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">App level access</div>
        <AppAccessLevelSelect
          permissions={permissions}
          selectedPermissionIds={selectedPermissionIds}
          setSelectedPermissionIds={setSelectedPermissionIds}
          onListPermissionsPage={onListPermissionsPage}
          disabled={disabled}
        />
      </div>

      {showAtomicToggle ? (
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
            <span className="text-sm">Atomic low-level permissions</span>
            <input
              type="checkbox"
              checked={showAtomic}
              disabled={disabled}
              onChange={(e) => setShowAtomic(e.target.checked)}
              className="rounded border-input"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Advanced mode. Most teams should rely on app-level access only.
          </p>
        </div>
      ) : null}

      {(!showAtomicToggle || showAtomic) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Atomic permissions</div>
          <PermissionsByAppSelect
            selectedPermissionIds={selectedPermissionIds}
            setSelectedPermissionIds={setSelectedPermissionIds}
            permissions={permissions}
            onListPermissionsPage={onListPermissionsPage}
            hasMorePermissions={hasMorePermissions}
            loadingMorePermissions={loadingMorePermissions}
            onLoadMorePermissions={onLoadMorePermissions}
            onSearchPermissionsPage={onSearchPermissionsPage}
          />
        </div>
      )}
    </div>
  );
}
