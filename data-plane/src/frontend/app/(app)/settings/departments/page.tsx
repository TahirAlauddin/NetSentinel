"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsNavTabs } from "@/components/settings/settings-nav-tabs";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { GripVertical, Trash2, Edit2 } from "lucide-react";
import { DepartmentRecord } from "@/types/departments";
import { api } from "@/lib/utils";

async function listDepartments(): Promise<DepartmentRecord[]> {
  const response = await api.get<
    DepartmentRecord[] | { results: DepartmentRecord[] }
  >("/infrastructure/departments/");
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch departments");
  }

  const data = response.data;

  // Handle paginated response
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: DepartmentRecord[] }).results)
  ) {
    return (data as { results: DepartmentRecord[] }).results;
  }

  // Handle direct array response
  if (Array.isArray(data)) {
    return data;
  }

  console.warn("Unexpected departments data format:", data);
  return [];
}

async function createDepartment(
  name: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.post("/infrastructure/departments/", {
    name,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create department",
    };
  }

  return {
    success: true,
    message: "Department created successfully",
  };
}

async function deleteDepartment(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.delete(`/infrastructure/departments/${id}/`);

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to delete department",
    };
  }

  return {
    success: true,
    message: "Department deleted successfully",
  };
}

async function updateDepartment(
  id: number,
  name: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.put(`/infrastructure/departments/${id}/`, {
    name,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to update department",
    };
  }

  return {
    success: true,
    message: "Department updated successfully",
  };
}

export default function DepartmentsPage() {
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const handleAddDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
      toast.error("Department name is required");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createDepartment(name);

      if (result.success) {
        toast.success(result.message || "Department created successfully!");
        const departmentList = await listDepartments();
        setDepartments(Array.isArray(departmentList) ? departmentList : []);
        if (addFormRef.current) {
          addFormRef.current.reset();
        }
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create department");
      }
    } catch (error) {
      console.error("Failed to add department:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      const result = await deleteDepartment(id);

      if (result.success) {
        toast.success(result.message || "Department deleted successfully!");
        const departmentList = await listDepartments();
        setDepartments(Array.isArray(departmentList) ? departmentList : []);
      } else {
        toast.error(result.error || "Failed to delete department");
      }
    } catch (error) {
      console.error("Failed to delete department:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleStartEdit = (department: DepartmentRecord) => {
    setEditingId(department.id);
    setEditName(department.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      const result = await updateDepartment(id, editName.trim());

      if (result.success) {
        toast.success(result.message || "Department updated successfully!");
        const departmentList = await listDepartments();
        setDepartments(Array.isArray(departmentList) ? departmentList : []);
        setEditingId(null);
        setEditName("");
      } else {
        toast.error(result.error || "Failed to update department");
      }
    } catch (error) {
      console.error("Failed to update department:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const departmentList = await listDepartments();
        setDepartments(Array.isArray(departmentList) ? departmentList : []);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        setDepartments([]);
      }
    }

    fetchDepartments();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          {/* Main content */}
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Departments" />
              <SettingsNavTabs />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Add Department Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm"
                      >
                        {showAddForm ? "Cancel" : "Add Department"}
                      </button>
                    </div>

                    {/* Add Department Form */}
                    {showAddForm && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">
                          Add New Department
                        </h2>
                        <form ref={addFormRef} onSubmit={handleAddDepartment} className="space-y-4">
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium mb-2"
                            >
                              Department Name
                            </label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              required
                              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                              placeholder="e.g., IT, HR, Finance"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {submitting ? "Adding..." : "Add Department"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Departments list */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Current departments
                      </h2>
                      <div className="border border-border rounded-lg overflow-hidden bg-card max-w-2xl">
                        {departments.length > 0 ? (
                          departments.map((dept) => (
                            <div
                              key={dept.id}
                              className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-[oklch(0.98_0_0)]"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                              {editingId === dept.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(dept.id)}
                                    className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm font-medium text-[oklch(0.40_0.15_249)]">
                                    {dept.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleStartEdit(dept)}
                                      className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDepartment(dept.id)}
                                      className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No departments found
                          </div>
                        )}
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
