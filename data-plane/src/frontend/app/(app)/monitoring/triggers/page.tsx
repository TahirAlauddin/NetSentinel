"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, MoreHorizontal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SeverityBadge } from "@/components/apps/monitoring/severity-badge";
import type { Trigger, Host, Template, TriggerFormData, TriggerSeverity } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

const SEVERITIES: TriggerSeverity[] = [
  "not_classified",
  "information",
  "warning",
  "average",
  "high",
  "disaster",
];

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    expression: "",
    severity: "average" as TriggerSeverity,
    description: "",
    hostId: "",
    templateId: "",
    ownerType: "host" as "host" | "template",
  });
  const [saving, setSaving] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (severityFilter !== "all") params.severity = severityFilter;
    if (stateFilter !== "all") params.state = stateFilter;

    Promise.all([api.getTriggers(params), api.getHosts(), api.getTemplates()]).then(
      ([tRes, hRes, tplRes]) => {
        if (tRes.data) setTriggers(Array.isArray(tRes.data) ? tRes.data : []);
        if (hRes.data) setHosts(Array.isArray(hRes.data) ? hRes.data : []);
        if (tplRes.data) setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);
        setLoading(false);
      }
    );
  }, [search, severityFilter, stateFilter, refreshKey]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.expression.trim()) return;
    setSaving(true);

    const payload: TriggerFormData = {
      name: formData.name,
      expression: formData.expression,
      severity: formData.severity,
      description: formData.description,
      ...(formData.ownerType === "host" && formData.hostId
        ? { host: Number(formData.hostId) }
        : formData.ownerType === "template" && formData.templateId
        ? { template: Number(formData.templateId) }
        : {}),
    };

    const res = await api.createTrigger(payload);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else { toast.success("Trigger created."); setDialogOpen(false); load(); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this trigger?")) return;
    const res = await api.deleteTrigger(id);
    if (res.error) toast.error(res.error);
    else { toast.success("Trigger deleted."); load(); }
  };

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader currentPage="Triggers" />

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-56" placeholder="Search triggers…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITIES.map((s) => (<SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              <SelectItem value="normal">Normal (OK)</SelectItem>
              <SelectItem value="problem">Problem</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setFormData({ name: "", expression: "", severity: "average", description: "", hostId: "", templateId: "", ownerType: "host" }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Trigger
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading triggers…</div>
          ) : triggers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Zap className="h-12 w-12 opacity-30" />
              <p className="text-sm">No triggers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Host / Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="font-medium max-w-[260px] truncate">{t.name}</TableCell>
                    <TableCell><SeverityBadge severity={t.severity} /></TableCell>
                    <TableCell>
                      <Badge variant={t.state === "problem" ? "destructive" : t.state === "unknown" ? "secondary" : "outline"} className="text-xs">
                        {t.state_display}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.host_name ?? t.template_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "enabled" ? "default" : "secondary"} className="text-xs">{t.status_display}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}>
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
          <DialogHeader><DialogTitle>Create Trigger</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Host is unreachable" />
            </div>
            <div className="space-y-1.5">
              <Label>Expression *</Label>
              <Textarea value={formData.expression} onChange={(e) => setFormData((p) => ({ ...p, expression: e.target.value }))} placeholder="last(/host/agent.ping)=0" className="font-mono text-sm" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData((p) => ({ ...p, severity: v as TriggerSeverity }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((s) => (<SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <div className="flex gap-2">
                {(["host", "template"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setFormData((p) => ({ ...p, ownerType: t }))} className={`px-3 py-1 rounded-md text-sm border capitalize ${formData.ownerType === t ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{t}</button>
                ))}
              </div>
              {formData.ownerType === "host" ? (
                <Select value={formData.hostId} onValueChange={(v) => setFormData((p) => ({ ...p, hostId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select host" /></SelectTrigger>
                  <SelectContent>{hosts.map((h) => (<SelectItem key={h.id} value={h.id.toString()}>{h.visible_name || h.name}</SelectItem>))}</SelectContent>
                </Select>
              ) : (
                <Select value={formData.templateId} onValueChange={(v) => setFormData((p) => ({ ...p, templateId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>{templates.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}</SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.expression.trim()}>
              {saving ? "Creating…" : "Create Trigger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
