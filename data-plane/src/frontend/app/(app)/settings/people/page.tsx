"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddUserForm from "@/components/add-user-form";
import UserList from "@/components/users-list";
import { UserRecord } from "@/types/users";
import { listUsers, addUser } from "../actions";

export default function PeoplePage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await addUser(formData);

      if (result.success) {
        toast.success(result.message || "User created successfully!");
        // Refresh users list after successful addition
        const userList = await listUsers();
        setUsers(Array.isArray(userList) ? userList : []);
        // Reset form
        e.currentTarget.reset();
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
          <SettingsSidebar />

          {/* Main content */}
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="People" />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Add User Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 text-sm"
                      >
                        {showAddForm ? "Cancel" : "Add User"}
                      </button>
                    </div>

                    {/* Add User Form */}
                    {showAddForm && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">
                          Add New User
                        </h2>
                        <AddUserForm
                          handleAddUser={handleAddUser}
                          submitting={submitting}
                        />
                      </div>
                    )}

                    {/* Users list */}
                    <div className="rounded-md border border-border bg-card text-card-foreground">
                      <div className="px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-medium">Users</h2>
                      </div>
                      <div className="p-2 sm:p-4 overflow-x-auto">
                        <UserList users={users} />
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

