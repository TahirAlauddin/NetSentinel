"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import GroupForm from "@/components/groups/group-form";
import { usePaginatedAppend } from "@/hooks/use-paginated-append";
import { validateId } from "@/lib/security/input-validation";
import { GroupRecord, PermissionBundleRecord, PermissionRecord } from "@/types/groups";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listGroups,
  listPermissionBundles,
  listPermissionsPage,
  updateGroup,
} from "../../../actions";

export default function EditGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const groupId = validateId(params.id);

  const [loadingInitial, setLoadingInitial] = useState(groupId === null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [bundlesCatalog, setBundlesCatalog] = useState<PermissionBundleRecord[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<number[]>([]);

  const {
    items: permissions,
    setFirstPage: setPermissionsFirstPage,
  } = usePaginatedAppend<PermissionRecord>({
    fetchPage: listPermissionsPage,
    onLoadMoreError: () => toast.error("Could not load more permissions."),
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user && !session.user.isSuperuser) {
      router.replace("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (groupId === null) {
      router.replace("/settings/groups");
      return;
    }

    const load = async () => {
      setLoadingInitial(true);
      try {
        const [groupsList, permissionsPage, bundlesList] = await Promise.all([
          listGroups(),
          listPermissionsPage(1),
          listPermissionBundles(),
        ]);

        const group = (Array.isArray(groupsList) ? groupsList : []).find(
          (g: GroupRecord) => g.id === groupId
        );

        if (!group) {
          toast.error("Group not found");
          router.replace("/settings/groups");
          return;
        }

        setFormName(group.name || "");
        setSelectedPermissions(group.permissions || []);
        setSelectedBundleIds(group.permission_bundle_ids || []);
        setBundlesCatalog(Array.isArray(bundlesList) ? bundlesList : []);
        setPermissionsFirstPage(permissionsPage);
      } catch (error) {
        console.error("Failed to load group:", error);
        toast.error("Failed to load group");
        router.replace("/settings/groups");
      } finally {
        setLoadingInitial(false);
      }
    };

    void load();
  }, [groupId, router, setPermissionsFirstPage]);

  const handleCancel = () => {
    router.push("/settings/groups");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (groupId === null) return;

    setSubmitting(true);
    try {
      const result = await updateGroup(
        groupId,
        formName,
        selectedPermissions,
        selectedBundleIds,
      );
      if (result.success) {
        toast.success(result.message || "Group updated successfully!");
        router.push("/settings/groups");
      } else {
        toast.error(result.error || "Failed to update group");
      }
    } catch (error) {
      console.error("Failed to update group:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (groupId === null) return null;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Edit Group" />

              {loadingInitial ? (
                <div className="text-sm text-muted-foreground mt-4">Loading...</div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h2 className="text-sm font-medium mb-4">Edit Group</h2>
                  <GroupForm
                    name={formName}
                    setName={setFormName}
                    selectedPermissions={selectedPermissions}
                    setSelectedPermissions={setSelectedPermissions}
                    bundles={bundlesCatalog}
                    selectedBundleIds={selectedBundleIds}
                    setSelectedBundleIds={setSelectedBundleIds}
                    permissions={permissions}
                    onListPermissionsPage={listPermissionsPage}
                    submitting={submitting}
                    onSubmit={handleUpdate}
                    onCancel={handleCancel}
                    submitLabel="Save Changes"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

