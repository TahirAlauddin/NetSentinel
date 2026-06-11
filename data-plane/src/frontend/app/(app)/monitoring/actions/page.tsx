"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, MoreHorizontal, Play, Pencil } from "lucide-react";
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
import { ActionFormDialog } from "@/components/apps/monitoring/action-form";
import type { Action } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    api.getActions(search ? { search } : undefined).then((res) => {
      if (res.data) setActions(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [search, refreshKey]);

  const openCreate = () => {
    setEditingAction(null);
    setDialogOpen(true);
  };

  const openEdit = (action: Action) => {
    setEditingAction(action);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this action?")) return;
    const res = await api.deleteAction(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Deleted.");
      load();
    }
  };

  const handleToggle = async (a: Action) => {
    const res = await api.updateAction(a.id, {
      status: a.status === "enabled" ? "disabled" : "enabled",
    });
    if (res.error) toast.error(res.error);
    else load();
  };

  return (
    <div className="p-6 space-y-6">
      <MonitoringHeader currentPage="Actions" />

      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-56"
            placeholder="Search actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Create Action
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">
              Loading…
            </div>
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Play className="h-12 w-12 opacity-30" />
              <p className="text-sm">No actions configured.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Event source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Conditions</TableHead>
                  <TableHead className="text-right">Operations</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((a) => (
                  <TableRow
                    key={a.id}
                    className="group cursor-pointer"
                    onClick={() => openEdit(a)}
                  >
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.eventsource_display}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant={a.status === "enabled" ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={() => handleToggle(a)}
                      >
                        {a.status_display}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {a.condition_count}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {a.operation_count}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuItem onClick={() => openEdit(a)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(a.id)}
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

      <ActionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        action={editingAction}
        onSaved={load}
      />
    </div>
  );
}
