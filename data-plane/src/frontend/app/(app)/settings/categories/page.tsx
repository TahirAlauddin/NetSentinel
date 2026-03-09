"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsNavTabs } from "@/components/settings/settings-nav-tabs";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { GripVertical, Trash2, Edit2 } from "lucide-react";
import { INFRASTRUCTURE } from "@/constants/api-paths";
import { getFormString } from "@/lib/form-utils";
import { api, normalizeListResponse } from "@/lib/utils";
import { CategoryRecord } from "@/types/categories";

async function listCategories(): Promise<CategoryRecord[]> {
  const response = await api.get<
    CategoryRecord[] | { results: CategoryRecord[] }
  >(INFRASTRUCTURE.CATEGORIES);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch categories");
  }
  return normalizeListResponse(response.data);
}

async function createCategory(
  name: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.post(INFRASTRUCTURE.CATEGORIES, {
    name,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create category",
    };
  }

  return {
    success: true,
    message: "Category created successfully",
  };
}

async function deleteCategory(
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.delete(`${INFRASTRUCTURE.CATEGORIES}${id}/`);

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to delete category",
    };
  }

  return {
    success: true,
    message: "Category deleted successfully",
  };
}

async function updateCategory(
  id: number,
  name: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await api.put(`${INFRASTRUCTURE.CATEGORIES}${id}/`, {
    name,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to update category",
    };
  }

  return {
    success: true,
    message: "Category updated successfully",
  };
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const addFormRef = useRef<HTMLFormElement>(null);

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = getFormString(formData, "name");

    if (!name) {
      toast.error("Category name is required");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createCategory(name);

      if (result.success) {
        toast.success(result.message || "Category created successfully!");
        const categoryList = await listCategories();
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        if (addFormRef.current) {
          addFormRef.current.reset();
        }
        setShowAddForm(false);
      } else {
        toast.error(result.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Failed to add category:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const result = await deleteCategory(id);

      if (result.success) {
        toast.success(result.message || "Category deleted successfully!");
        const categoryList = await listCategories();
        setCategories(Array.isArray(categoryList) ? categoryList : []);
      } else {
        toast.error(result.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleStartEdit = (category: CategoryRecord) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const result = await updateCategory(id, editName.trim());

      if (result.success) {
        toast.success(result.message || "Category updated successfully!");
        const categoryList = await listCategories();
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setEditingId(null);
        setEditName("");
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoryList = await listCategories();
        setCategories(Array.isArray(categoryList) ? categoryList : []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      }
    }

    fetchCategories();
  }, [session]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          {/* Main content */}
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="Categories" />
              <SettingsNavTabs />

              {/* Content area */}
              <div className="flex gap-8">
                {/* Content */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {/* Add Category Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 text-sm"
                      >
                        {showAddForm ? "Cancel" : "Add Category"}
                      </button>
                    </div>

                    {/* Add Category Form */}
                    {showAddForm && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">
                          Add New Category
                        </h2>
                        <form ref={addFormRef} onSubmit={handleAddCategory} className="space-y-4">
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium mb-2"
                            >
                              Category Name
                            </label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              required
                              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                              placeholder="e.g., Analytics, Security, Infrastructure"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {submitting ? "Adding..." : "Add Category"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Categories list */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">
                        Current categories
                      </h2>
                      <div className="border border-border rounded-lg overflow-hidden bg-card max-w-2xl">
                        {categories.length > 0 ? (
                          categories.map((cat) => (
                            <div
                              key={cat.id}
                              className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-[oklch(0.98_0_0)]"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                              {editingId === cat.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(cat.id)}
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
                                    {cat.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleStartEdit(cat)}
                                      className="p-1 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(cat.id)}
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
                            No categories found
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
