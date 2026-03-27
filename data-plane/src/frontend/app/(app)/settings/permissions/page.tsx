"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import PermissionBundlesList from "@/components/permissions/permission-bundles-list";
import PermissionBundleForm from "@/components/permissions/permission-bundle-form";
import { usePaginatedAppend } from "@/hooks/use-paginated-append";
import { PermissionBundleRecord, PermissionRecord } from "@/types/groups";
import {
  listPermissionBundles,
  listPermissionsPage,
  searchPermissionsPage,
  updatePermissionBundle,
  deletePermissionBundle,
} from "../actions";

/*
This page is used to list all the permission bundles. It is protected by the settings.view_permissionbundle permission.
*/
export default function PermissionBundlesPage() {
  const { data: session } = useSession();
  const [bundles, setBundles] = useState<PermissionBundleRecord[]>([]);

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
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formApp, setFormApp] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const resetForm = () => {
    setFormName("");
    setFormCode("");
    setFormApp("");
    setFormDescription("");
    setSelectedPermissions([]);
  };

  const handleUpdateBundle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);

    try {
      const result = await updatePermissionBundle(editingId, {
        name: formName,
        code: formCode,
        app: formApp,
        description: formDescription,
        permissionIds: selectedPermissions,
      });

      if (result.success) {
        toast.success(result.message || "Permission bundle updated successfully!");
        const bundlesList = await listPermissionBundles();
        setBundles(Array.isArray(bundlesList) ? bundlesList : []);
        resetForm();
        setEditingId(null);
      } else {
        toast.error(result.error || "Failed to update permission bundle");
      }
    } catch (error) {
      console.error("Failed to update permission bundle:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBundle = async (id: number) => {
    if (!confirm("Are you sure you want to delete this permission bundle?")) return;

    try {
      const result = await deletePermissionBundle(id);
      if (result.success) {
        toast.success(result.message || "Permission bundle deleted successfully!");
        const bundlesList = await listPermissionBundles();
        setBundles(Array.isArray(bundlesList) ? bundlesList : []);
      } else {
        toast.error(result.error || "Failed to delete permission bundle");
      }
    } catch (error) {
      console.error("Failed to delete permission bundle:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleStartEdit = (bundle: PermissionBundleRecord) => {
    setEditingId(bundle.id);
    setFormName(bundle.name);
    setFormCode(bundle.code);
    setFormApp(bundle.app ?? "");
    setFormDescription(bundle.description ?? "");
    setSelectedPermissions(bundle.permissions || []);
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditingId(null);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [bundlesList, permissionsPage] = await Promise.all([
          listPermissionBundles(),
          listPermissionsPage(1),
        ]);
        setBundles(Array.isArray(bundlesList) ? bundlesList : []);
        setPermissionsFirstPage(permissionsPage);
      } catch (error) {
        console.error("Failed to fetch permission bundles data:", error);
        setBundles([]);
        resetPermissionsPagination();
      }
    }

    fetchData();
  }, [session, resetPermissionsPagination, setPermissionsFirstPage]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Permission Bundles" />

              <div className="flex gap-8">
                <div className="flex-1">
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <Link
                        href="/settings/permissions/new"
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm"
                      >
                        Add Bundle
                      </Link>
                    </div>

                    {editingId !== null && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">Edit Permission Bundle</h2>
                        <PermissionBundleForm
                          name={formName}
                          setName={setFormName}
                          code={formCode}
                          setCode={setFormCode}
                          app={formApp}
                          setApp={setFormApp}
                          description={formDescription}
                          setDescription={setFormDescription}
                          selectedPermissions={selectedPermissions}
                          setSelectedPermissions={setSelectedPermissions}
                          permissions={permissions}
                          onListPermissionsPage={listPermissionsPage}
                          hasMorePermissions={permissionsHasMore}
                          loadingMorePermissions={loadingMorePermissions}
                          onLoadMorePermissions={loadMorePermissions}
                          onSearchPermissionsPage={searchPermissionsPage}
                          submitting={submitting}
                          onSubmit={handleUpdateBundle}
                          onCancel={handleCancelEdit}
                          submitLabel="Save Changes"
                        />
                      </div>
                    )}

                    <div>
                      <h2 className="text-lg font-semibold mb-4">Current Permission Bundles</h2>
                      <PermissionBundlesList
                        bundles={bundles}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteBundle}
                        editingId={editingId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

