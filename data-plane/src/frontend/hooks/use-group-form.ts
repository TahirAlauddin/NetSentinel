"use client";

import { useCallback, useState } from "react";
import { GroupRecord, PermissionRecord } from "@/types/groups";
import type { PaginatedFetchResult } from "@/hooks/use-paginated-append";

export type UseGroupFormReturn = {
  name: string;
  setName: (name: string) => void;
  selectedPermissions: number[];
  setSelectedPermissions: (ids: number[]) => void;
  /** Sent on save; set from group on edit (no UI). New groups use []. */
  selectedBundleIds: number[];
  permissions: PermissionRecord[];
  initialize: (opts: {
    group?: GroupRecord;
    permissionsPage?: PaginatedFetchResult<PermissionRecord>;
  }) => void;
  reset: () => void;
};

export function useGroupForm(): UseGroupFormReturn {
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);

  const initialize = useCallback(
    ({
      group,
      permissionsPage,
    }: {
      group?: GroupRecord;
      permissionsPage?: PaginatedFetchResult<PermissionRecord>;
    }) => {
      if (group) {
        setName(group.name ?? "");
        setSelectedPermissions(group.permissions ?? []);
        setSelectedBundleIds(group.permission_bundle_ids ?? []);
      }
      if (permissionsPage?.results) {
        setPermissions(permissionsPage.results);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setName("");
    setSelectedPermissions([]);
    setSelectedBundleIds([]);
    setPermissions([]);
  }, []);

  return {
    name,
    setName,
    selectedPermissions,
    setSelectedPermissions,
    selectedBundleIds,
    permissions,
    initialize,
    reset,
  };
}
