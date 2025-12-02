"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import GroupsList from "@/components/groups/groups-list";
import GroupForm from "@/components/groups/group-form";
import { GroupRecord, PermissionRecord } from "@/types/groups";
import {
  listGroups,
  listPermissions,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../actions";

export default function GroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const handleAddGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createGroup(formName, selectedPermissions);

      if (result.success) {
        toast.success(result.message || "Group created successfully!");
        const groupsList = await listGroups();
        setGroups(Array.isArray(groupsList) ? groupsList : []);
        resetForm();
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to add group:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);

    try {
      const result = await updateGroup(editingId, formName, selectedPermissions);

      if (result.success) {
        toast.success(result.message || "Group updated successfully!");
        const groupsList = await listGroups();
        setGroups(Array.isArray(groupsList) ? groupsList : []);
        resetForm();
        setEditingId(null);
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

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) {
      return;
    }

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

  const handleStartEdit = (group: GroupRecord) => {
    setEditingId(group.id);
    setFormName(group.name);
    setSelectedPermissions(group.permissions || []);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditingId(null);
  };

  const resetForm = () => {
    setFormName("");
    setSelectedPermissions([]);
  };

  const handleCancelAdd = () => {
    resetForm();
    setShowAddForm(false);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupsList, permissionsList] = await Promise.all([
          listGroups(),
          listPermissions(),
        ]);
        setGroups(Array.isArray(groupsList) ? groupsList : []);
        setPermissions(Array.isArray(permissionsList) ? permissionsList : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setGroups([]);
        setPermissions([]);
      }
    }

    fetchData();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
          <SettingsSidebar />

          {/* Main content */}
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Groups & Permissions" />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Add Group Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (editingId) {
                            handleCancelEdit();
                          }
                          setShowAddForm(!showAddForm);
                        }}
                        disabled={editingId !== null}
                        className="px-4 py-2 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {showAddForm ? "Cancel" : "Add Group"}
                      </button>
                    </div>

                    {/* Add Group Form */}
                    {showAddForm && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">
                          Add New Group
                        </h2>
                        <GroupForm
                          name={formName}
                          setName={setFormName}
                          selectedPermissions={selectedPermissions}
                          setSelectedPermissions={setSelectedPermissions}
                          permissions={permissions}
                          submitting={submitting}
                          onSubmit={handleAddGroup}
                          onCancel={handleCancelAdd}
                          submitLabel="Add Group"
                        />
                      </div>
                    )}

                    {/* Edit Group Form */}
                    {editingId !== null && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">
                          Edit Group
                        </h2>
                        <GroupForm
                          name={formName}
                          setName={setFormName}
                          selectedPermissions={selectedPermissions}
                          setSelectedPermissions={setSelectedPermissions}
                          permissions={permissions}
                          submitting={submitting}
                          onSubmit={handleUpdateGroup}
                          onCancel={handleCancelEdit}
                          submitLabel="Save Changes"
                        />
                      </div>
                    )}

                    {/* Groups list */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Current Groups
                      </h2>
                      <GroupsList
                        groups={groups}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteGroup}
                        editingId={editingId}
                      />
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

