"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HostGroup } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

interface HostGroupsPanelProps {
  groups: HostGroup[];
  loading?: boolean;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onRefresh: () => void;
  /** Panel heading (default: Host Groups). */
  title?: string;
  /** Singular label for the count column (default: host). */
  itemLabel?: string;
  /** Override per-group count; defaults to `host_count`. */
  getItemCount?: (group: HostGroup) => number;
  /** Dialog titles when creating/editing groups. */
  createDialogTitle?: string;
  editDialogTitle?: string;
  emptyMessage?: string;
  deleteConfirmMessage?: string;
}

export function HostGroupsPanel({
  groups,
  loading = false,
  selectedGroupId,
  onSelectGroup,
  onRefresh,
  title = "Host Groups",
  itemLabel = "host",
  getItemCount = (g) => g.host_count,
  createDialogTitle = "Create Host Group",
  editDialogTitle = "Edit Host Group",
  emptyMessage = "No host groups yet.",
  deleteConfirmMessage = "Delete this host group?",
}: HostGroupsPanelProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HostGroup | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setDialogOpen(true);
  };

  const openEdit = (g: HostGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(g);
    setFormName(g.name);
    setFormDesc(g.description);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const payload = { name: formName.trim(), description: formDesc };
    const res = editing
      ? await api.updateHostGroup(editing.id, payload)
      : await api.createHostGroup(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(editing ? "Group updated." : "Group created.");
      setDialogOpen(false);
      onRefresh();
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(deleteConfirmMessage)) return;
    const res = await api.deleteHostGroup(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Group deleted.");
      if (selectedGroupId === id.toString()) {
        onSelectGroup(null);
      }
      onRefresh();
    }
  };

  const toggleGroupFilter = (id: number) => {
    const idStr = id.toString();
    onSelectGroup(selectedGroupId === idStr ? null : idStr);
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left text-sm font-medium hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                !open && "-rotate-90"
              )}
            />
            <FolderOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span>
              {title}
              {!loading && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  ({groups.length})
                </span>
              )}
            </span>
          </button>
          {selectedGroupId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onSelectGroup(null)}
            >
              Clear filter
            </Button>
          )}
        </div>

        {open && (
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3 animate-pulse"
                  >
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="h-4 w-16 rounded bg-muted ml-auto" />
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <ul className="divide-y">
                {groups.map((g) => {
                  const isSelected = selectedGroupId === g.id.toString();
                  const count = getItemCount(g);
                  return (
                    <li key={g.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                          isSelected && "bg-orange-50/80 dark:bg-orange-950/20"
                        )}
                        onClick={() => toggleGroupFilter(g.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleGroupFilter(g.id);
                          }
                        }}
                      >
                        <span
                          className={cn(
                            "flex-1 font-medium truncate",
                            isSelected && "text-orange-700 dark:text-orange-400"
                          )}
                        >
                          {g.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {count} {itemLabel}
                          {count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex shrink-0 items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit group"
                            onClick={(e) => openEdit(g, e)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete group"
                            onClick={(e) => handleDelete(g.id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={openCreate}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Group
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? editDialogTitle : createDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Production"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
