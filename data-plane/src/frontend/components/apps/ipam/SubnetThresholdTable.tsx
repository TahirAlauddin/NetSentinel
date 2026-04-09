"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SubnetThreshold } from "@/types/ipam";

interface SubnetThresholdTableProps {
  thresholds: SubnetThreshold[];
  loading: boolean;
  onCheck: (id: number) => void;
  onEdit: (threshold: SubnetThreshold) => void;
  onDelete: (id: number) => void;
}

function getStatusBadge(status: SubnetThreshold["current_status"]) {
  const variants = {
    healthy: { variant: "default" as const, label: "Healthy" },
    warning: { variant: "secondary" as const, label: "Warning" },
    critical: { variant: "destructive" as const, label: "Critical" },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

export function SubnetThresholdTable({
  thresholds,
  loading,
  onCheck,
  onEdit,
  onDelete,
}: SubnetThresholdTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading thresholds...
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subnet</TableHead>
          <TableHead>Warning</TableHead>
          <TableHead>Critical</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Alerts</TableHead>
          <TableHead>Last Checked</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {thresholds.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No thresholds configured. Create a threshold to start monitoring.
            </TableCell>
          </TableRow>
        ) : (
          thresholds.map((threshold) => (
            <TableRow key={threshold.id}>
              <TableCell className="font-mono">
                {threshold.subnet_detail?.network || threshold.subnet}
              </TableCell>
              <TableCell>{threshold.warning_threshold}%</TableCell>
              <TableCell>{threshold.critical_threshold}%</TableCell>
              <TableCell>{getStatusBadge(threshold.current_status)}</TableCell>
              <TableCell>
                {threshold.unacknowledged_alerts_count !== undefined &&
                threshold.unacknowledged_alerts_count > 0 ? (
                  <Badge variant="destructive">
                    {threshold.unacknowledged_alerts_count} unacknowledged
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {threshold.last_checked
                  ? formatDistanceToNow(new Date(threshold.last_checked), { addSuffix: true })
                  : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onCheck(threshold.id)}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(threshold)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(threshold.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

