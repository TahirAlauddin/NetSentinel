"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import GroupForm from "@/components/groups/group-form";
import { useGroupForm } from "@/hooks/use-group-form";
import { validateId } from "@/lib/security/input-validation";
import type { GroupRecord } from "@/types/groups";
import type { PermissionBundleRecord } from "@/types/groups";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listGroups, listPermissionBundles, updateGroup } from "../../../actions";
import {
  buildEmptyAppAccess,
  type AccessLevel,
  type AppAccessSelection,
} from "@/constants/permissions-by-app";

const levelPriority: Record<AccessLevel, number> = {
  none: 0,
  read: 1,
  edit: 2,
  admin: 3,
};

/**
 * This function is used to convert a bundle label to an app key.
 * This function is only here because there can be inconsistencies in the bundle labels, i.e. phone_management vs phone_mgmt.
 * It is used to convert the app label from the bundle to the app key.
 */
function appKeyFromBundleLabel(
  appLabel: string,
): keyof AppAccessSelection | null {
  const MAP: Record<string, keyof AppAccessSelection> = {
    phone_management: "phone_mgmt",
    assets: "assets",
    contracts: "contracts",
    ipam: "ipam",
    telecom: "telecom",
  };
  if (MAP[appLabel]) return MAP[appLabel];
  if (["users", "infrastructure", "notifications", "auth", "admin", "contenttypes", "sessions"].includes(appLabel)) {
    return "users";
  }
  return null;
}

function levelFromBundleCode(code: string): Exclude<AccessLevel, "none"> | null {
  if (code.endsWith("_admin_all")) return "admin";
  if (code.endsWith("_edit_all")) return "edit";
  if (code.endsWith("_read_all")) return "read";
  return null;
}

/** Derive UI app access levels from bundle assignments on an existing group. */
function appAccessFromBundles(
  bundleIds: number[],
  bundles: PermissionBundleRecord[],
): AppAccessSelection {
  const access = buildEmptyAppAccess();
  const bundleIdSet = new Set(bundleIds);
  for (const bundle of bundles) {
    if (!bundleIdSet.has(bundle.id)) continue;
    const appKey = appKeyFromBundleLabel((bundle.app ?? "").trim());
    const level = levelFromBundleCode(bundle.code ?? "");
    if (!appKey || !level) continue;
    if (levelPriority[level] > levelPriority[access[appKey]]) {
      access[appKey] = level;
    }
  }
  return access;
}

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
        const [groupsList, bundles] = await Promise.all([listGroups(), listPermissionBundles()]);

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
          appAccess: appAccessFromBundles(group.permission_bundle_ids ?? [], bundles),
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
      const result = await updateGroup(groupId, form.name, form.appAccess);
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
