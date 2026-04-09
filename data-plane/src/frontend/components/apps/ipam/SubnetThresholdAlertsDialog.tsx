"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import type { SubnetThresholdAlert } from "@/types/ipam";

interface SubnetThresholdAlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: SubnetThresholdAlert[];
  onAcknowledge: (id: number) => void | Promise<void>;
  onBulkAcknowledge: (ids: number[]) => void | Promise<void>;
}

export function SubnetThresholdAlertsDialog({
  open,
  onOpenChange,
  alerts,
  onAcknowledge,
  onBulkAcknowledge,
}: SubnetThresholdAlertsDialogProps) {
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(unacknowledgedAlerts.map((a) => a.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleToggleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedAlerts((prev) => [...prev, id]);
    } else {
      setSelectedAlerts((prev) => prev.filter((existingId) => existingId !== id));
    }
  };

  const handleBulkAcknowledgeClick = () => {
    if (selectedAlerts.length === 0) return;
    void onBulkAcknowledge(selectedAlerts);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Threshold Alerts</AlertDialogTitle>
          <AlertDialogDescription>Unacknowledged threshold alerts</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          {unacknowledgedAlerts.length > 0 && (
            <div className="flex justify-between items-center">
              <div>
                {selectedAlerts.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedAlerts.length} selected
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleBulkAcknowledgeClick}
                disabled={selectedAlerts.length === 0}
              >
                Acknowledge Selected
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedAlerts.length === unacknowledgedAlerts.length &&
                      unacknowledgedAlerts.length > 0
                    }
                    onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead>Subnet</TableHead>
                <TableHead>Alert Type</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unacknowledgedAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No unacknowledged alerts
                  </TableCell>
                </TableRow>
              ) : (
                unacknowledgedAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAlerts.includes(alert.id)}
                        onCheckedChange={(checked) =>
                          handleToggleSelectOne(alert.id, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono">
                      {alert.threshold_detail?.subnet_network || alert.threshold}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.alert_type === "critical"
                            ? "destructive"
                            : alert.alert_type === "warning"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {alert.alert_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.utilization_percentage.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.sent_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

