"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, MoreHorizontal, BarChart2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import type { Item, Host, Template, ItemFormData, ItemType, ValueType } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

const ITEM_TYPES = [
  { value: "zabbix_agent", label: "Zabbix agent" },
  { value: "zabbix_agent_active", label: "Zabbix agent (active)" },
  { value: "snmp_v2c", label: "SNMPv2 agent" },
  { value: "snmp_v3", label: "SNMPv3 agent" },
  { value: "http_agent", label: "HTTP agent" },
  { value: "calculated", label: "Calculated" },
  { value: "trapper", label: "Zabbix trapper" },
  { value: "internal", label: "Zabbix internal" },
  { value: "external", label: "External check" },
];

const VALUE_TYPES = [
  { value: "float", label: "Numeric (float)" },
  { value: "unsigned_int", label: "Numeric (unsigned)" },
  { value: "character", label: "Character" },
  { value: "text", label: "Text" },
  { value: "log", label: "Log" },
];

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    item_type: "zabbix_agent",
    value_type: "float",
    units: "",
    delay: "1m",
    history: "90d",
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
    if (typeFilter !== "all") params.item_type = typeFilter;
    if (statusFilter !== "all") params.status = statusFilter;

    Promise.all([api.getItems(params), api.getHosts(), api.getTemplates()]).then(
      ([iRes, hRes, tRes]) => {
        if (iRes.data) setItems(Array.isArray(iRes.data) ? iRes.data : []);
        if (hRes.data) setHosts(Array.isArray(hRes.data) ? hRes.data : []);
        if (tRes.data) setTemplates(Array.isArray(tRes.data) ? tRes.data : []);
        setLoading(false);
      }
    );
  }, [search, typeFilter, statusFilter, refreshKey]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.key.trim()) return;
    setSaving(true);
    const payload: ItemFormData = {
      name: formData.name,
      key: formData.key,
      item_type: formData.item_type as ItemType,
      value_type: formData.value_type as ValueType,
      units: formData.units,
      delay: formData.delay,
      history: formData.history,
      description: formData.description,
      ...(formData.ownerType === "host" && formData.hostId
        ? { host: Number(formData.hostId) }
        : formData.ownerType === "template" && formData.templateId
        ? { template: Number(formData.templateId) }
        : {}),
    };

    const res = await api.createItem(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Item created.");
      setDialogOpen(false);
      load();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    const res = await api.deleteItem(id);
    if (res.error) toast.error(res.error);
    else { toast.success("Item deleted."); load(); }
  };

  const handleToggleStatus = async (item: Item) => {
    const res = await api.updateItem(item.id, {
      status: item.status === "enabled" ? "disabled" : "enabled",
    });
    if (res.error) toast.error(res.error);
    else load();
  };

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader currentPage="Items" />

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-56" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ITEM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setFormData({ name: "", key: "", item_type: "zabbix_agent", value_type: "float", units: "", delay: "1m", history: "90d", description: "", hostId: "", templateId: "", ownerType: "host" }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading items…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <BarChart2 className="h-12 w-12 opacity-30" />
              <p className="text-sm">No items found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Host / Template</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">{item.key}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.item_type_display}</TableCell>
                    <TableCell className="text-sm">{item.host_name ?? item.template_name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.delay}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "enabled" ? "default" : "secondary"} className="text-xs cursor-pointer" onClick={() => handleToggleStatus(item)}>
                        {item.status_display}
                      </Badge>
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
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
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
            <DialogTitle>Create Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="CPU utilization" />
              </div>
              <div className="space-y-1.5">
                <Label>Key *</Label>
                <Input value={formData.key} onChange={(e) => setFormData((p) => ({ ...p, key: e.target.value }))} placeholder="system.cpu.util" className="font-mono text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={formData.item_type} onValueChange={(v) => setFormData((p) => ({ ...p, item_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ITEM_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value type</Label>
                <Select value={formData.value_type} onValueChange={(v) => setFormData((p) => ({ ...p, value_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VALUE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Units</Label>
                <Input value={formData.units} onChange={(e) => setFormData((p) => ({ ...p, units: e.target.value }))} placeholder="%" />
              </div>
              <div className="space-y-1.5">
                <Label>Update interval</Label>
                <Input value={formData.delay} onChange={(e) => setFormData((p) => ({ ...p, delay: e.target.value }))} placeholder="1m" />
              </div>
              <div className="space-y-1.5">
                <Label>History</Label>
                <Input value={formData.history} onChange={(e) => setFormData((p) => ({ ...p, history: e.target.value }))} placeholder="90d" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData((p) => ({ ...p, ownerType: "host" }))} className={`px-3 py-1 rounded-md text-sm border ${formData.ownerType === "host" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>Host</button>
                <button type="button" onClick={() => setFormData((p) => ({ ...p, ownerType: "template" }))} className={`px-3 py-1 rounded-md text-sm border ${formData.ownerType === "template" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>Template</button>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.key.trim()}>
              {saving ? "Creating…" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
