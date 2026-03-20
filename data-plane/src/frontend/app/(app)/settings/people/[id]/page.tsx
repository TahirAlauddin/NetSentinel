"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { validateId } from "@/lib/security/input-validation";
import { usePaginatedAppend } from "@/hooks/use-paginated-append";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  listGroups,
  getUser,
  getUserAssignments,
  listPermissionsPage,
  updateUserAssignments,
  updateUserBasic,
} from "../../actions";
import { GroupRecord, PermissionRecord } from "@/types/groups";

const BOTTOM_THRESHOLD_PX = 72;

function PermissionsPicker({
  permissions,
  selectedPermissionIds,
  setSelectedPermissionIds,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  permissions: PermissionRecord[];
  selectedPermissionIds: number[];
  setSelectedPermissionIds: (ids: number[]) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
}) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const nearBottomArmedRef = useRef(false);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, perm) => {
        const key = perm.content_type || 0;
        if (!acc[key]) acc[key] = [];
        acc[key].push(perm);
        return acc;
      },
      {} as Record<number, PermissionRecord[]>
    );
  }, [permissions]);

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;

    const onScroll = () => {
      if (!hasMore || loadingMore) return;
      const distanceFromBottom = root.scrollHeight - root.scrollTop - root.clientHeight;
      const nearBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;

      if (!nearBottom) {
        nearBottomArmedRef.current = false;
        return;
      }

      if (nearBottomArmedRef.current) return;
      nearBottomArmedRef.current = true;
      void Promise.resolve(onLoadMore());
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  const togglePermission = (permissionId: number) => {
    if (selectedPermissionIds.includes(permissionId)) {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== permissionId));
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, permissionId]);
    }
  };

  return (
    <div
      ref={scrollRootRef}
      className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-background"
    >
      {permissions.length > 0 ? (
        <>
          {Object.entries(groupedPermissions).map(([contentType, perms]) => (
            <div key={contentType} className="space-y-1">
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
          {hasMore ? (
            <div
              className="text-xs text-muted-foreground text-center py-2 min-h-[1.5rem]"
              aria-hidden
            >
              {loadingMore ? "Loading more…" : ""}
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">No permissions loaded</div>
      )}
    </div>
  );
}

function GroupsPicker({
  groups,
  selectedGroupIds,
  setSelectedGroupIds,
}: {
  groups: GroupRecord[];
  selectedGroupIds: number[];
  setSelectedGroupIds: (ids: number[]) => void;
}) {
  const toggleGroup = (groupId: number) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  return (
    <div className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-background">
      {groups.length > 0 ? (
        groups.map((g) => (
          <label
            key={g.id}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[oklch(0.98_0_0)] p-1 rounded"
          >
            <input
              type="checkbox"
              checked={selectedGroupIds.includes(g.id)}
              onChange={() => toggleGroup(g.id)}
              className="rounded border-input"
            />
            <span className="text-xs">{g.name}</span>
          </label>
        ))
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">No groups found</div>
      )}
    </div>
  );
}

export default function PeopleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const personId = validateId(params.id);

  const [loadingInitial, setLoadingInitial] = useState(personId !== null);
  const [saving, setSaving] = useState(false);
  const [basicSaving, setBasicSaving] = useState(false);

  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const {
    items: permissions,
    hasMore: permissionsHasMore,
    loadingMore: loadingMorePermissions,
    setFirstPage: setPermissionsFirstPage,
    loadMore: loadMorePermissions,
  } = usePaginatedAppend<PermissionRecord>({
    fetchPage: listPermissionsPage,
    onLoadMoreError: () => toast.error("Could not load more permissions."),
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && !session?.user?.isSuperuser) {
      router.replace("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (personId === null) {
      router.replace("/settings/people");
      return;
    }

    const load = async () => {
      setLoadingInitial(true);
      try {
        const [userData, assignments, groupsList, permissionsPage] = await Promise.all([
          getUser(personId),
          getUserAssignments(personId),
          listGroups(),
          listPermissionsPage(1),
        ]);

        if (!userData) {
          toast.error("User not found");
          router.replace("/settings/people");
          return;
        }

        setUsername(userData.username || "");
        setEmail(userData.email || "");
        setFirstName(userData.first_name || "");
        setLastName(userData.last_name || "");
        setGroups(Array.isArray(groupsList) ? groupsList : []);
        setSelectedGroupIds(assignments.group_ids || []);
        setSelectedPermissionIds(assignments.permission_ids || []);
        setPermissionsFirstPage(permissionsPage);
      } catch (error) {
        console.error("Failed to load user detail:", error);
        toast.error("Failed to load user detail");
        router.replace("/settings/people");
      } finally {
        setLoadingInitial(false);
      }
    };

    load();
  }, [personId, router, setPermissionsFirstPage]);

  const handleSaveDetails = async () => {
    if (personId === null) return;
    setBasicSaving(true);
    try {
      const result = await updateUserBasic(personId, {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update user details");
        return;
      }

      toast.success(result.message || "User details updated");
    } catch (error) {
      console.error("Failed to save details:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setBasicSaving(false);
    }
  };

  const handleSave = async () => {
    if (personId === null) return;
    setSaving(true);
    try {
      const result = await updateUserAssignments(personId, selectedGroupIds, selectedPermissionIds);
      if (!result.success) {
        toast.error(result.error || "Failed to update assignments");
        return;
      }
      toast.success(result.message || "Assignments updated");
    } catch (error) {
      console.error("Failed to save assignments:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (personId === null) return null;

  if (loadingInitial) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="min-h-[calc(100dvh-120px)]">
            <div className="p-8">
              <SettingsHeader currentPage="User Detail" />
              <div className="text-sm text-muted-foreground mt-4">Loading...</div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="User Detail" />

              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h2 className="text-sm font-medium mb-4">User details</h2>

                  <div className="grid gap-3 max-w-2xl">
                    <div className="grid gap-1">
                      <label className="text-xs sm:text-sm text-muted-foreground">Username</label>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-1">
                      <label className="text-xs sm:text-sm text-muted-foreground">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs sm:text-sm text-muted-foreground">
                          First name
                        </label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs sm:text-sm text-muted-foreground">
                          Last name
                        </label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <button
                        type="button"
                        disabled={basicSaving}
                        onClick={handleSaveDetails}
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {basicSaving ? "Saving..." : "Edit"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h2 className="text-sm font-medium mb-4">Groups and permissions</h2>

                  <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Groups</div>
                      <GroupsPicker
                        groups={groups}
                        selectedGroupIds={selectedGroupIds}
                        setSelectedGroupIds={setSelectedGroupIds}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Permissions</div>
                      <PermissionsPicker
                        permissions={permissions}
                        selectedPermissionIds={selectedPermissionIds}
                        setSelectedPermissionIds={setSelectedPermissionIds}
                        hasMore={permissionsHasMore}
                        loadingMore={loadingMorePermissions}
                        onLoadMore={loadMorePermissions}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {saving ? "Saving..." : "Save assignments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
