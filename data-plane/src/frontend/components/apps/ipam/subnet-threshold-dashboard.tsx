/* eslint-disable max-lines */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
} from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { SubnetThreshold, SubnetThresholdAlert, Subnet } from "@/types/ipam";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ipamApi = new IpamApiClient();

interface SubnetThresholdDashboardProps {
  subnetId?: number;
}

export function SubnetThresholdDashboard({ subnetId }: SubnetThresholdDashboardProps) {
  const [thresholds, setThresholds] = useState<SubnetThreshold[]>([]);
  const [alerts, setAlerts] = useState<SubnetThresholdAlert[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<SubnetThreshold | null>(null);
  const [formData, setFormData] = useState({
    subnet: subnetId?.toString() || "",
    warning_threshold: 75,
    critical_threshold: 90,
    enable_alerts: true,
    alert_email: "",
    notify_on_warning: true,
    notify_on_critical: true,
    notify_on_recovery: false,
  });
  const [showAlerts, setShowAlerts] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);

  useEffect(() => {
    loadSubnets();
    loadThresholds();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subnetId]);

  const loadSubnets = async () => {
    try {
      const response = await ipamApi.getSubnets();
      if (response.data) {
        setSubnets(extractIpamArrayData<Subnet>(response.data));
      }
    } catch (error) {
      console.error("Error loading subnets:", error);
    }
  };

  const loadThresholds = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (subnetId) {
        params.subnet = subnetId;
      }
      const response = await ipamApi.getSubnetThresholds(params);
      if (response.data) {
        setThresholds(extractIpamArrayData<SubnetThreshold>(response.data));
      }
    } catch (error) {
      console.error("Error loading thresholds:", error);
      toast.error("Failed to load thresholds");
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const params: Record<string, unknown> = { acknowledged: false };
      if (subnetId) {
        params.subnet = subnetId;
      }
      const response = await ipamApi.getSubnetThresholdAlerts(params);
      if (response.data) {
        setAlerts(extractIpamArrayData<SubnetThresholdAlert>(response.data));
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      parseInt(formData.warning_threshold.toString()) >=
      parseInt(formData.critical_threshold.toString())
    ) {
      toast.error("Warning threshold must be less than critical threshold");
      return;
    }

    try {
      const data = {
        subnet: parseInt(formData.subnet),
        warning_threshold: parseInt(formData.warning_threshold.toString()),
        critical_threshold: parseInt(formData.critical_threshold.toString()),
        enable_alerts: formData.enable_alerts,
        alert_email: formData.alert_email || undefined,
        notify_on_warning: formData.notify_on_warning,
        notify_on_critical: formData.notify_on_critical,
        notify_on_recovery: formData.notify_on_recovery,
      };

      if (editingThreshold) {
        await ipamApi.updateSubnetThreshold(editingThreshold.id, data);
        toast.success("Threshold updated successfully");
      } else {
        await ipamApi.createSubnetThreshold(data);
        toast.success("Threshold created successfully");
      }
      setDialogOpen(false);
      resetForm();
      loadThresholds();
    } catch (error) {
      console.error("Error saving threshold:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save threshold");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this threshold?")) {
      return;
    }

    try {
      await ipamApi.deleteSubnetThreshold(id);
      toast.success("Threshold deleted successfully");
      loadThresholds();
    } catch (error) {
      console.error("Error deleting threshold:", error);
      toast.error("Failed to delete threshold");
    }
  };

  const handleCheck = async (id: number) => {
    try {
      await ipamApi.checkSubnetThreshold(id);
      toast.success("Threshold checked successfully");
      loadThresholds();
      loadAlerts();
    } catch (error) {
      console.error("Error checking threshold:", error);
      toast.error("Failed to check threshold");
    }
  };

  const handleCheckAll = async () => {
    try {
      await ipamApi.checkAllSubnetThresholds();
      toast.success("All thresholds checked successfully");
      loadThresholds();
      loadAlerts();
    } catch (error) {
      console.error("Error checking thresholds:", error);
      toast.error("Failed to check thresholds");
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await ipamApi.acknowledgeSubnetThresholdAlert(id);
      toast.success("Alert acknowledged");
      loadAlerts();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) {
      toast.error("Please select alerts to acknowledge");
      return;
    }

    try {
      await ipamApi.bulkAcknowledgeSubnetThresholdAlerts(selectedAlerts);
      toast.success(`${selectedAlerts.length} alerts acknowledged`);
      setSelectedAlerts([]);
      loadAlerts();
    } catch (error) {
      console.error("Error acknowledging alerts:", error);
      toast.error("Failed to acknowledge alerts");
    }
  };

  const resetForm = () => {
    setEditingThreshold(null);
    setFormData({
      subnet: subnetId?.toString() || "",
      warning_threshold: 75,
      critical_threshold: 90,
      enable_alerts: true,
      alert_email: "",
      notify_on_warning: true,
      notify_on_critical: true,
      notify_on_recovery: false,
    });
  };

  const handleEdit = (threshold: SubnetThreshold) => {
    setEditingThreshold(threshold);
    setFormData({
      subnet: threshold.subnet.toString(),
      warning_threshold: threshold.warning_threshold,
      critical_threshold: threshold.critical_threshold,
      enable_alerts: threshold.enable_alerts,
      alert_email: threshold.alert_email || "",
      notify_on_warning: threshold.notify_on_warning,
      notify_on_critical: threshold.notify_on_critical,
      notify_on_recovery: threshold.notify_on_recovery,
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: SubnetThreshold["current_status"]) => {
    const variants = {
      healthy: { variant: "default" as const, icon: CheckCircle2, label: "Healthy" },
      warning: { variant: "secondary" as const, icon: AlertTriangle, label: "Warning" },
      critical: { variant: "destructive" as const, icon: XCircle, label: "Critical" },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Threshold Monitoring</h2>
          {unacknowledgedAlerts.length > 0 && (
            <div className="mt-2">
              <Button variant="outline" onClick={() => setShowAlerts(true)} className="gap-2">
                <Bell className="w-4 h-4" />
                {unacknowledgedAlerts.length} Unacknowledged Alert
                {unacknowledgedAlerts.length !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Check All
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Threshold
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingThreshold ? "Edit Threshold" : "Create Threshold"}
                </DialogTitle>
                <DialogDescription>
                  {editingThreshold
                    ? "Update threshold settings"
                    : "Configure utilization thresholds for a subnet"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subnet">Subnet *</Label>
                  <Select
                    value={formData.subnet}
                    onValueChange={(value) => setFormData({ ...formData, subnet: value })}
                    disabled={!!subnetId}
                  >
                    <SelectTrigger id="subnet">
                      <SelectValue placeholder="Select subnet" />
                    </SelectTrigger>
                    <SelectContent>
                      {subnets.map((subnet) => (
                        <SelectItem key={subnet.id} value={subnet.id.toString()}>
                          {subnet.network} - {subnet.description || "No description"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warning-threshold">Warning Threshold (%) *</Label>
                    <Input
                      id="warning-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.warning_threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warning_threshold: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="critical-threshold">Critical Threshold (%) *</Label>
                    <Input
                      id="critical-threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.critical_threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          critical_threshold: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-email">Alert Email (optional)</Label>
                  <Input
                    id="alert-email"
                    type="email"
                    value={formData.alert_email}
                    onChange={(e) => setFormData({ ...formData, alert_email: e.target.value })}
                    placeholder="alerts@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use subnet customer email or default
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable_alerts"
                      checked={formData.enable_alerts}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enable_alerts: !!checked })
                      }
                    />
                    <Label htmlFor="enable_alerts" className="cursor-pointer">
                      Enable alerts
                    </Label>
                  </div>
                  {formData.enable_alerts && (
                    <>
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id="notify_on_warning"
                          checked={formData.notify_on_warning}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, notify_on_warning: !!checked })
                          }
                        />
                        <Label htmlFor="notify_on_warning" className="cursor-pointer">
                          Notify on warning threshold
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id="notify_on_critical"
                          checked={formData.notify_on_critical}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, notify_on_critical: !!checked })
                          }
                        />
                        <Label htmlFor="notify_on_critical" className="cursor-pointer">
                          Notify on critical threshold
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id="notify_on_recovery"
                          checked={formData.notify_on_recovery}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, notify_on_recovery: !!checked })
                          }
                        />
                        <Label htmlFor="notify_on_recovery" className="cursor-pointer">
                          Notify on recovery (below threshold)
                        </Label>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading thresholds...</div>
      ) : (
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
                      <Button variant="ghost" size="sm" onClick={() => handleCheck(threshold.id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(threshold)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(threshold.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Alerts Dialog */}
      <AlertDialog open={showAlerts} onOpenChange={setShowAlerts}>
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
                  onClick={handleBulkAcknowledge}
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
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAlerts(unacknowledgedAlerts.map((a) => a.id));
                        } else {
                          setSelectedAlerts([]);
                        }
                      }}
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
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAlerts([...selectedAlerts, alert.id]);
                            } else {
                              setSelectedAlerts(selectedAlerts.filter((id) => id !== alert.id));
                            }
                          }}
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
                          onClick={() => handleAcknowledge(alert.id)}
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
    </div>
  );
}
