"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FileCode2, MoreHorizontal } from "lucide-react";
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
import type { Template, HostGroup } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [hostGroups, setHostGroups] = useState<HostGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    Promise.all([
      api.getTemplates(search ? { search } : undefined),
      api.getHostGroups(),
    ]).then(([tRes, gRes]) => {
      if (tRes.data) setTemplates(Array.isArray(tRes.data) ? tRes.data : []);
      if (gRes.data) setHostGroups(Array.isArray(gRes.data) ? gRes.data : []);
      setLoading(false);
    });
  }, [search, refreshKey]);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setSelectedGroups([]);
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setFormName(t.name);
    setFormDesc(t.description);
    setSelectedGroups(t.host_groups);
    setDialogOpen(true);
  };

  const toggleGroup = (id: number) =>
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const payload = { name: formName.trim(), description: formDesc, host_groups: selectedGroups };
    const res = editing
      ? await api.updateTemplate(editing.id, payload)
      : await api.createTemplate(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(editing ? "Template updated." : "Template created.");
      setDialogOpen(false);
      load();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template? Items and triggers linked to this template will also be removed.")) return;
    const res = await api.deleteTemplate(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Template deleted.");
      load();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader currentPage="Templates" />

      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-56"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <FileCode2 className="h-12 w-12 opacity-30" />
              <p className="text-sm">No templates yet.</p>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Create First Template
              </Button>
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
                        {t.host_groups_detail.slice(0, 3).map((g) => (
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
              <Label>Host Groups</Label>
              <div className="flex flex-wrap gap-2">
                {hostGroups.map((g) => (
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
              </div>
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
    </div>
  );
}
