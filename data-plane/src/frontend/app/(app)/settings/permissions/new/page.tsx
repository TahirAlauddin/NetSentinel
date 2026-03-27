"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import PermissionBundleForm from "@/components/permissions/permission-bundle-form";
import { usePaginatedAppend } from "@/hooks/use-paginated-append";
import { PermissionRecord } from "@/types/groups";
import {
  listPermissionsPage,
  searchPermissionsPage,
  createPermissionBundle,
} from "../../actions";

/*
This page is used to create a new permission bundle. It is protected by the settings.add_permissionbundle permission.
*/
export default function NewPermissionBundlePage() {
  const router = useRouter();

  const {
    items: permissions,
    hasMore: permissionsHasMore,
    loadingMore: loadingMorePermissions,
    setFirstPage: setPermissionsFirstPage,
    loadMore: loadMorePermissions,
    reset: resetPermissionsPagination,
  } = usePaginatedAppend<PermissionRecord>({
    fetchPage: listPermissionsPage,
    onLoadMoreError: () => toast.error("Could not load more permissions."),
  });

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [app, setApp] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  useEffect(() => {
    listPermissionsPage(1)
      .then(setPermissionsFirstPage)
      .catch(() => {
        resetPermissionsPagination();
        toast.error("Could not load permissions.");
      });
  }, [setPermissionsFirstPage, resetPermissionsPagination]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createPermissionBundle({
        name,
        code,
        app,
        description,
        permissionIds: selectedPermissions,
      });

      if (result.success) {
        toast.success(result.message || "Permission bundle created successfully!");
        router.push("/settings/permissions");
      } else {
        toast.error(result.error || "Failed to create permission bundle");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="New Permission Bundle" />

              <div className="max-w-2xl">
                <PermissionBundleForm
                  name={name}
                  setName={setName}
                  code={code}
                  setCode={setCode}
                  app={app}
                  setApp={setApp}
                  description={description}
                  setDescription={setDescription}
                  selectedPermissions={selectedPermissions}
                  setSelectedPermissions={setSelectedPermissions}
                  permissions={permissions}
                  onListPermissionsPage={listPermissionsPage}
                  hasMorePermissions={permissionsHasMore}
                  loadingMorePermissions={loadingMorePermissions}
                  onLoadMorePermissions={loadMorePermissions}
                  onSearchPermissionsPage={searchPermissionsPage}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  onCancel={() => router.push("/settings/permissions")}
                  submitLabel="Create Bundle"
                />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
