"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  RefreshCw,
  Bell,
} from "lucide-react";
import { SubnetThresholdAlertsDialog } from "@/components/apps/ipam/SubnetThresholdAlertsDialog";
import { SubnetThresholdTable } from "@/components/apps/ipam/SubnetThresholdTable";
import { useSubnetThresholdDashboard } from "@/hooks/useSubnetThresholdDashboard";

interface SubnetThresholdDashboardProps {
  subnetId?: number;
}

export function SubnetThresholdDashboard({ subnetId }: SubnetThresholdDashboardProps) {
  const {
    thresholds,
    alerts,
    subnets,
    loading,
    dialogOpen,
    setDialogOpen,
    editingThreshold,
    formData,
    setFormData,
    resetForm,
    showAlerts,
    setShowAlerts,
    unacknowledgedAlerts,
    handleSubmit,
    handleDelete,
    handleCheck,
    handleCheckAll,
    handleAcknowledge,
    handleBulkAcknowledge,
    handleEdit,
  } = useSubnetThresholdDashboard({ subnetId });

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

      <SubnetThresholdTable
        thresholds={thresholds}
        loading={loading}
        onCheck={handleCheck}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SubnetThresholdAlertsDialog
        open={showAlerts}
        onOpenChange={setShowAlerts}
        alerts={alerts}
        onAcknowledge={handleAcknowledge}
        onBulkAcknowledge={handleBulkAcknowledge}
      />
    </div>
  );
}
