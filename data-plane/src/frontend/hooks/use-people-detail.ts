"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { usePaginatedAppend } from "@/hooks/use-paginated-append";
import { GroupRecord, PermissionRecord } from "@/types/groups";
import {
  getUser,
  getUserAssignments,
  listGroups,
  listPermissionsPage,
  updateUserAssignments,
  updateUserBasic,
} from "@/app/(app)/settings/actions";

export type UsePeopleDetailReturn = {
  loadingInitial: boolean;
  saving: boolean;
  basicSaving: boolean;
  groups: GroupRecord[];
  selectedGroupIds: number[];
  setSelectedGroupIds: (ids: number[]) => void;
  selectedPermissionIds: number[];
  setSelectedPermissionIds: (ids: number[]) => void;
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  permissions: PermissionRecord[];
  permissionsHasMore: boolean;
  loadingMorePermissions: boolean;
  loadMorePermissions: () => Promise<void>;
  saveDetails: () => Promise<void>;
  saveAssignments: () => Promise<void>;
};

export function usePeopleDetail(personId: number | null): UsePeopleDetailReturn {
  const router = useRouter();
  const { data: session, status } = useSession();

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
    reset: resetPermissionsPagination,
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
        resetPermissionsPagination();
        router.replace("/settings/people");
      } finally {
        setLoadingInitial(false);
      }
    };

    void load();
  }, [personId, resetPermissionsPagination, router, setPermissionsFirstPage]);

  const saveDetails = async () => {
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

  const saveAssignments = async () => {
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

  return {
    loadingInitial,
    saving,
    basicSaving,
    groups,
    selectedGroupIds,
    setSelectedGroupIds,
    selectedPermissionIds,
    setSelectedPermissionIds,
    username,
    setUsername,
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    permissions,
    permissionsHasMore,
    loadingMorePermissions,
    loadMorePermissions,
    saveDetails,
    saveAssignments,
  };
}
