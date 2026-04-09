"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddUserForm from "@/components/add-user-form";
import { addUser, listGroups } from "../../actions";
import { GroupRecord } from "@/types/groups";

export default function NewPeoplePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const result = await listGroups();
        setGroups(result);
      } catch (error) {
        console.error("Failed to load groups:", error);
        toast.error("Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    };
    void loadGroups();
  }, []);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    try {
      if (!session?.user?.isSuperuser) {
        toast.error("Only superusers can add users.");
        return;
      }

      const result = await addUser(formData);
      if (!result.success) {
        toast.error(result.error || "Failed to create user");
        return;
      }

      toast.success(result.message || "User created successfully!");
      if (result.userId) {
        router.replace(`/settings/people/${result.userId}`);
      } else {
        router.replace("/settings/people");
      }
    } catch (error) {
      console.error("Failed to add user:", error);
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
              <SettingsHeader currentPage="Add Person" />

              <div className="bg-card border border-border rounded-lg p-4">
                <h2 className="text-sm font-medium mb-4">Add New User</h2>
                {loadingGroups ? (
                  <div className="text-sm text-muted-foreground">Loading groups...</div>
                ) : (
                  <AddUserForm
                    handleAddUser={handleAddUser}
                    submitting={submitting}
                    groups={groups}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

