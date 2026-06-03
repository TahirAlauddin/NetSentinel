"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FileCode2, MoreHorizontal, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { TemplateGroupsPanel } from "@/components/apps/monitoring/template-groups-panel";
import type { Template, TemplateGroup } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const loadData = useCallback(() => {
    setLoadingTemplates(true);
    setLoadingGroups(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (selectedGroupId) params.template_group = selectedGroupId;

      const tRes = await api.getTemplates(params);
      if (!isMounted) return;

      if (tRes.data) setTemplates(Array.isArray(tRes.data) ? tRes.data : []);
      setLoadingTemplates(false);
    };

    void fetchTemplates();
    return () => {
      isMounted = false;
    };
  }, [search, selectedGroupId, refreshKey]);

  useEffect(() => {
    let isMounted = true;
    const fetchGroups = async () => {
      const gRes = await api.getTemplateGroups();
      if (!isMounted) return;

      if (gRes.data) setTemplateGroups(Array.isArray(gRes.data) ? gRes.data : []);
      setLoadingGroups(false);
    };

    void fetchGroups();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const selectedGroupName =
    selectedGroupId != null
      ? templateGroups.find((g) => g.id.toString() === selectedGroupId)?.name
      : null;

  const hasFilters = Boolean(search || selectedGroupId);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setSelectedGroups(selectedGroupId ? [Number(selectedGroupId)] : []);
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setFormName(t.name);
    setFormDesc(t.description);
    setSelectedGroups(t.template_groups);
    setDialogOpen(true);
  };

  const toggleGroup = (id: number) =>
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const payload = { name: formName.trim(), description: formDesc, template_groups: selectedGroups };
    const res = editing
      ? await api.updateTemplate(editing.id, payload)
      : await api.createTemplate(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(editing ? "Template updated." : "Template created.");
      setDialogOpen(false);
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template? Items and triggers linked to this template will also be removed.")) return;
    const res = await api.deleteTemplate(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Template deleted.");
      loadData();
    }
  };

  const handleSearchChange = (value: string) => {
    setLoadingTemplates(true);
    setSearch(value);
  };

  const handleGroupSelect = (groupId: string | null) => {
    setLoadingTemplates(true);
    setSelectedGroupId(groupId);
  };

  const clearFilters = () => {
    setLoadingTemplates(true);
    setSearch("");
    setSelectedGroupId(null);
  };

  const groupPickerGroups = useMemo(() => {
    if (!selectedGroupId) return templateGroups;
    const selectedId = Number(selectedGroupId);
    const selected = templateGroups.find((g) => g.id === selectedId);
    const rest = templateGroups.filter((g) => g.id !== selectedId);
    return selected ? [selected, ...rest] : templateGroups;
  }, [templateGroups, selectedGroupId]);

  return (
    <div className="p-6 space-y-5">
      <MonitoringHeader currentPage="Templates" />

      <TemplateGroupsPanel
        groups={templateGroups}
        loading={loadingGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleGroupSelect}
        onRefresh={loadData}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-9 w-56"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingTemplates || loadingGroups ? "animate-spin" : ""}`}
            />
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!loadingTemplates && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
              {selectedGroupName ? ` in ${selectedGroupName}` : ""}
            </span>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Template
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadingTemplates ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted ml-auto" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <FileCode2 className="h-12 w-12 opacity-30" />
              <p className="text-sm">
                {hasFilters ? "No templates match your filters." : "No templates yet."}
              </p>
              {!hasFilters && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" /> Create First Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Triggers</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.template_groups_detail.slice(0, 3).map((g) => (
                          <Badge key={g.id} variant="outline" className="text-xs">
                            {g.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {t.item_count}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {t.trigger_count}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Linux by Zabbix agent"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Template groups *</Label>
              <p className="text-xs text-muted-foreground">
                Zabbix requires at least one group per template.
              </p>
              <div className="flex flex-wrap gap-2">
                {groupPickerGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedGroups.includes(g.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
                {templateGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No template groups yet. Create one using the panel above.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim() || selectedGroups.length === 0}
            >
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
