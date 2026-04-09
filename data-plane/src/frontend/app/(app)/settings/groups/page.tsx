"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import GroupsList from "@/components/groups/groups-list";
import { GroupRecord } from "@/types/groups";
import { listGroups, deleteGroup } from "../actions";

export default function GroupsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [groups, setGroups] = useState<GroupRecord[]>([]);

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      const result = await deleteGroup(id);
      if (result.success) {
        toast.success(result.message || "Group deleted successfully!");
        const groupsList = await listGroups();
        setGroups(Array.isArray(groupsList) ? groupsList : []);
      } else {
        toast.error(result.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleEditGroup = (group: GroupRecord) => {
    router.push(`/settings/groups/edit/${group.id}`);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const groupsList = await listGroups();
        setGroups(Array.isArray(groupsList) ? groupsList : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setGroups([]);
      }
    }

    fetchData();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Groups & Permissions" />

              <div className="flex gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex justify-end">
                    <Link
                      href="/settings/groups/new"
                      className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm inline-block text-center"
                    >
                      Add Group
                    </Link>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-4">Current Groups</h2>
                    <GroupsList
                      groups={groups}
                      onEdit={handleEditGroup}
                      onDelete={handleDeleteGroup}
                    />
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
