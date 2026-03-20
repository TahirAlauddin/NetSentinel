"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import UserList from "@/components/users-list";
import { UserRecord } from "@/types/users";
import { deleteUser, listUsers } from "../actions";
import { validateId } from "@/lib/security/input-validation";

export default function PeoplePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    if (session?.user && !session.user.isSuperuser) {
      router.replace("/unauthorized");
    }
  }, [session, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const userList = await listUsers();
        setUsers(Array.isArray(userList) ? userList : []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Silently fail - data will show when available
        setUsers([]);
      }
    }

    // Fetch in background - don't block rendering
    fetchUsers();
  }, [session]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    const parsed = validateId(userId);
    if (!parsed) {
      toast.error("Invalid user id");
      return;
    }
    try {
      const result = await deleteUser(parsed);
      if (!result.success) {
        toast.error(result.error || "Failed to delete user");
        return;
      }
      const userList = await listUsers();
      setUsers(Array.isArray(userList) ? userList : []);
      toast.success(result.message || "User deleted");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          {/* Main content */}
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="People" />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.push("/settings/people/new")}
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm"
                      >
                        Add User
                      </button>
                    </div>

                    {/* Users list */}
                    <div className="rounded-md border border-border bg-card text-card-foreground">
                      <div className="px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-medium">Users</h2>
                      </div>
                      <div className="p-2 sm:p-4 overflow-x-auto">
                        <UserList
                          users={users}
                          onView={(id) => router.push(`/settings/people/${id}`)}
                          onDelete={handleDelete}
                        />
                      </div>
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

