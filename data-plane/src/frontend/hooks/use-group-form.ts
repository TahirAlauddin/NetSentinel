"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { GroupRecord, PermissionBundleRecord, PermissionRecord } from "@/types/groups";
import { usePaginatedAppend, type PaginatedFetchResult } from "@/hooks/use-paginated-append";
import { listPermissionsPage } from "@/app/(app)/settings/actions";

export type UseGroupFormReturn = {
  name: string;
  setName: (name: string) => void;
  selectedPermissions: number[];
  setSelectedPermissions: (ids: number[]) => void;
  selectedBundleIds: number[];
  setSelectedBundleIds: (ids: number[]) => void;
  bundlesCatalog: PermissionBundleRecord[];
  setBundlesCatalog: (bundles: PermissionBundleRecord[]) => void;
  permissions: PermissionRecord[];
  hasMorePermissions: boolean;
  loadingMorePermissions: boolean;
  loadMorePermissions: () => Promise<void>;
  /** Seed the form with data from an existing group and/or initial catalog data. */
  initialize: (opts: {
    group?: GroupRecord;
    bundles?: PermissionBundleRecord[];
    permissionsPage?: PaginatedFetchResult<PermissionRecord>;
  }) => void;
  /** Clear all field state back to empty defaults. */
  reset: () => void;
};

export function useGroupForm(): UseGroupFormReturn {
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>([]);
  const [bundlesCatalog, setBundlesCatalog] = useState<PermissionBundleRecord[]>([]);

  const {
    items: permissions,
    hasMore: hasMorePermissions,
    loadingMore: loadingMorePermissions,
    setFirstPage,
    loadMore: loadMorePermissions,
    reset: resetPermissions,
  } = usePaginatedAppend<PermissionRecord>({
    fetchPage: listPermissionsPage,
    onLoadMoreError: () => toast.error("Could not load more permissions."),
  });

  const initialize = useCallback(
    ({
      group,
      bundles,
      permissionsPage,
    }: {
      group?: GroupRecord;
      bundles?: PermissionBundleRecord[];
      permissionsPage?: PaginatedFetchResult<PermissionRecord>;
    }) => {
      if (group) {
        setName(group.name ?? "");
        setSelectedPermissions(group.permissions ?? []);
        setSelectedBundleIds(group.permission_bundle_ids ?? []);
      }
      if (bundles) setBundlesCatalog(bundles);
      if (permissionsPage) setFirstPage(permissionsPage);
    },
    [setFirstPage]
  );

  const reset = useCallback(() => {
    setName("");
    setSelectedPermissions([]);
    setSelectedBundleIds([]);
    resetPermissions();
  }, [resetPermissions]);

  return {
    name,
    setName,
    selectedPermissions,
    setSelectedPermissions,
    selectedBundleIds,
    setSelectedBundleIds,
    bundlesCatalog,
    setBundlesCatalog,
    permissions,
    hasMorePermissions,
    loadingMorePermissions,
    loadMorePermissions,
    initialize,
    reset,
  };
}
