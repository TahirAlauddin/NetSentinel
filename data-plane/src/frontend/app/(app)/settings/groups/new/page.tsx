"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import GroupForm from "@/components/groups/group-form";
import { useGroupForm } from "@/hooks/use-group-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createGroup } from "../../actions";

/** Create-group page that submits app-level access selections. */
export default function NewGroupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const form = useGroupForm();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && session?.user && !session.user.isSuperuser) {
      router.replace("/unauthorized");
    }
  }, [session, status, router]);

  const handleCancel = () => {
    router.push("/settings/groups");
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createGroup(
        form.name,
        form.appAccess,
      );
      if (result.success) {
        toast.success(result.message || "Group created successfully!");
        router.push("/settings/groups");
      } else {
        toast.error(result.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
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
              <SettingsHeader currentPage="Add Group" />

              <div className="bg-card border border-border rounded-lg p-4">
                <h2 className="text-sm font-medium mb-4">Add New Group</h2>
                <GroupForm
                  form={form}
                  submitting={submitting}
                  onSubmit={handleCreate}
                  onCancel={handleCancel}
                  submitLabel="Add Group"
                />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
