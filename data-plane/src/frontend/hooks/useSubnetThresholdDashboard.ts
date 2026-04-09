"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { Subnet, SubnetThreshold, SubnetThresholdAlert } from "@/types/ipam";

const ipamApi = new IpamApiClient();

export interface SubnetThresholdFormState {
  subnet: string;
  warning_threshold: number;
  critical_threshold: number;
  enable_alerts: boolean;
  alert_email: string;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
  notify_on_recovery: boolean;
}

export interface UseSubnetThresholdDashboardOptions {
  subnetId?: number;
}

export interface UseSubnetThresholdDashboardResult {
  thresholds: SubnetThreshold[];
  alerts: SubnetThresholdAlert[];
  subnets: Subnet[];
  loading: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingThreshold: SubnetThreshold | null;
  formData: SubnetThresholdFormState;
  setFormData: (state: SubnetThresholdFormState) => void;
  resetForm: () => void;
  showAlerts: boolean;
  setShowAlerts: (open: boolean) => void;
  unacknowledgedAlerts: SubnetThresholdAlert[];
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  handleCheck: (id: number) => Promise<void>;
  handleCheckAll: () => Promise<void>;
  handleAcknowledge: (id: number) => Promise<void>;
  handleBulkAcknowledge: (ids: number[]) => Promise<void>;
  handleEdit: (threshold: SubnetThreshold) => void;
}

export function useSubnetThresholdDashboard(
  options: UseSubnetThresholdDashboardOptions = {}
): UseSubnetThresholdDashboardResult {
  const { subnetId } = options;

  const [thresholds, setThresholds] = useState<SubnetThreshold[]>([]);
  const [alerts, setAlerts] = useState<SubnetThresholdAlert[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<SubnetThreshold | null>(null);
  const [formData, setFormData] = useState<SubnetThresholdFormState>({
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

  useEffect(() => {
    void loadSubnets();
    void loadThresholds();
    void loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subnetId]);

  const loadSubnets = async () => {
    try {
      const response = await ipamApi.getSubnets();
      if (response.data) {
        setSubnets(extractIpamArrayData<Subnet>(response.data));
      }
    } catch (error) {
      // Keep errors logged but non-fatal for the dashboard
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
      const payload = {
        subnet: parseInt(formData.subnet, 10),
        warning_threshold: parseInt(formData.warning_threshold.toString(), 10),
        critical_threshold: parseInt(formData.critical_threshold.toString(), 10),
        enable_alerts: formData.enable_alerts,
        alert_email: formData.alert_email || undefined,
        notify_on_warning: formData.notify_on_warning,
        notify_on_critical: formData.notify_on_critical,
        notify_on_recovery: formData.notify_on_recovery,
      };

      if (editingThreshold) {
        await ipamApi.updateSubnetThreshold(editingThreshold.id, payload);
        toast.success("Threshold updated successfully");
      } else {
        await ipamApi.createSubnetThreshold(payload);
        toast.success("Threshold created successfully");
      }
      setDialogOpen(false);
      resetForm();
      void loadThresholds();
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
      void loadThresholds();
    } catch (error) {
      console.error("Error deleting threshold:", error);
      toast.error("Failed to delete threshold");
    }
  };

  const handleCheck = async (id: number) => {
    try {
      await ipamApi.checkSubnetThreshold(id);
      toast.success("Threshold checked successfully");
      void loadThresholds();
      void loadAlerts();
    } catch (error) {
      console.error("Error checking threshold:", error);
      toast.error("Failed to check threshold");
    }
  };

  const handleCheckAll = async () => {
    try {
      await ipamApi.checkAllSubnetThresholds();
      toast.success("All thresholds checked successfully");
      void loadThresholds();
      void loadAlerts();
    } catch (error) {
      console.error("Error checking thresholds:", error);
      toast.error("Failed to check thresholds");
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await ipamApi.acknowledgeSubnetThresholdAlert(id);
      toast.success("Alert acknowledged");
      void loadAlerts();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleBulkAcknowledge = async (ids: number[]) => {
    if (ids.length === 0) {
      toast.error("Please select alerts to acknowledge");
      return;
    }

    try {
      await ipamApi.bulkAcknowledgeSubnetThresholdAlerts(ids);
      toast.success(`${ids.length} alerts acknowledged`);
      void loadAlerts();
    } catch (error) {
      console.error("Error acknowledging alerts:", error);
      toast.error("Failed to acknowledge alerts");
    }
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

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged);

  return {
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
  };
}

