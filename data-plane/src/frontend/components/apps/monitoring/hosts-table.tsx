"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Pencil, Trash2, Power, PowerOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { AvailabilityBadge } from "./availability-badge";
import type { Host } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

interface HostsTableProps {
  hosts: Host[];
  onRefresh: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function HostsTable({ hosts, onRefresh, canEdit = true, canDelete = true }: HostsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this host? This action cannot be undone.")) return;
    setDeletingId(id);
    const res = await api.deleteHost(id);
    setDeletingId(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Host deleted.");
      onRefresh();
    }
  };

  const handleToggle = async (host: Host) => {
    const res =
      host.status === "monitored"
        ? await api.disableHost(host.id)
        : await api.enableHost(host.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Host ${host.status === "monitored" ? "disabled" : "enabled"}.`);
      onRefresh();
    }
  };

  if (hosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <p className="text-sm">No hosts found.</p>
        {canEdit && (
          <Button asChild size="sm">
            <Link href="/monitoring/hosts/add">
              <Plus className="h-4 w-4 mr-1" /> Add Host
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Groups</TableHead>
          <TableHead>Templates</TableHead>
          <TableHead className="text-center">Problems</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {hosts.map((host) => {
          const primaryGroup = host.host_groups_detail[0]?.name;
          const displayName = host.visible_name || host.name;
          const nameWithGroup =
            primaryGroup && host.host_groups_detail.length > 0
              ? `${displayName} (${primaryGroup})`
              : displayName;

          return (
          <TableRow key={host.id} className="group">
            <TableCell className="font-medium">
              <Link
                href={`/monitoring/hosts/${host.id}`}
                className="hover:underline text-foreground"
              >
                {nameWithGroup}
              </Link>
              {host.visible_name && (
                <div className="text-xs text-muted-foreground">{host.name}</div>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground font-mono">
              {host.display_address || "—"}
              {host.port !== 10050 && (
                <span className="ml-1 text-xs">:{host.port}</span>
              )}
            </TableCell>
            <TableCell>
              <AvailabilityBadge availability={host.availability} />
            </TableCell>
            <TableCell>
              <Badge
                variant={host.status === "monitored" ? "default" : "secondary"}
                className="text-xs"
              >
                {host.status_display}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {host.host_groups_detail.slice(0, 2).map((g) => (
                  <Badge key={g.id} variant="outline" className="text-xs">
                    {g.name}
                  </Badge>
                ))}
                {host.host_groups_detail.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{host.host_groups_detail.length - 2}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {host.templates_detail.length > 0
                ? `${host.templates_detail[0].name}${
                    host.templates_detail.length > 1
                      ? ` +${host.templates_detail.length - 1}`
                      : ""
                  }`
                : "—"}
            </TableCell>
            <TableCell className="text-center">
              {host.problem_count > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  {host.problem_count}
                </Badge>
              ) : (
                <span className="text-xs text-green-600 font-medium">OK</span>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    disabled={deletingId === host.id}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/monitoring/hosts/${host.id}`)}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push(`/monitoring/hosts/${host.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(host)}>
                        {host.status === "monitored" ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" /> Disable
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" /> Enable
                          </>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(host.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
        })}
      </TableBody>
    </Table>
  );
}
