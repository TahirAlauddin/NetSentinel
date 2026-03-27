"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import GroupForm from "@/components/groups/group-form";
import { useGroupForm } from "@/hooks/use-group-form";
import { validateId } from "@/lib/security/input-validation";
import { GroupRecord } from "@/types/groups";
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
  const form = useGroupForm();

  const [loadingInitial, setLoadingInitial] = useState(groupId === null);
  const [submitting, setSubmitting] = useState(false);

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
        const [groupsList, permissionsPage, bundles] = await Promise.all([
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

        form.initialize({
          group,
          bundles: Array.isArray(bundles) ? bundles : [],
          permissionsPage,
        });
      } catch (error) {
        console.error("Failed to load group:", error);
        toast.error("Failed to load group");
        router.replace("/settings/groups");
      } finally {
        setLoadingInitial(false);
      }
    };

    void load();
    // form.initialize is stable (useCallback with stable deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, router]);

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
        form.name,
        form.selectedPermissions,
        form.selectedBundleIds,
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
                    form={form}
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
