"use client";

import { useState, useEffect, useCallback } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { TemplateGroupsPanel } from "@/components/apps/monitoring/template-groups-panel";
import { TemplateFormDialog } from "@/components/apps/monitoring/template-form-dialog";
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
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const defaultGroupIds = selectedGroupId ? [Number(selectedGroupId)] : [];

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
                    <TableCell className="font-medium">
                      <div>{t.visible_name || t.name}</div>
                      {t.technical_name && t.technical_name !== (t.visible_name || t.name) && (
                        <div className="text-xs text-muted-foreground font-mono">{t.technical_name}</div>
                      )}
                    </TableCell>
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

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        templateGroups={templateGroups}
        allTemplates={templates}
        defaultGroupIds={defaultGroupIds}
        onSaved={loadData}
      />
    </div>
  );
}
