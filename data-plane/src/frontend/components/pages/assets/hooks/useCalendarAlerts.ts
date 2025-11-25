import { useCallback } from "react";
import { toast } from "sonner";
import { CalendarAlert } from "@/types/assets/fields";
import { CalendarAlertApiClient } from "@/lib/api-client/calendar-alert";
import { transformToCalendarAlertCreateUpdateDto } from "../utils/transform";

interface UseCalendarAlertsProps {
  alerts: CalendarAlert[];
  assetId?: number | string;
  onAlertsChange: (alerts: CalendarAlert[]) => void;
}

/**
 * Custom hook for managing calendar alerts
 * Handles CRUD operations and state updates
 */
export function useCalendarAlerts({
  alerts,
  assetId,
  onAlertsChange,
}: UseCalendarAlertsProps) {
  const apiClient = new CalendarAlertApiClient();

  /**
   * Get current alerts array, ensuring it's always an array
   */
  const getCurrentAlerts = useCallback((): CalendarAlert[] => {
    return Array.isArray(alerts) ? alerts : [];
  }, [alerts]);

  /**
   * Update alerts in the form state
   */
  const updateAlerts = useCallback(
    (updatedAlerts: CalendarAlert[]) => {
      onAlertsChange(updatedAlerts);
    },
    [onAlertsChange]
  );

  /**
   * Add a new alert to the list
   */
  const addAlert = useCallback(() => {
    const newAlert: CalendarAlert = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      date: "",
      message: "",
      assigned_to: null,
    };
    updateAlerts([...getCurrentAlerts(), newAlert]);
  }, [getCurrentAlerts, updateAlerts]);

  /**
   * Remove an alert from the list
   */
  const removeAlert = useCallback(
    async (index: number) => {
      const currentAlerts = getCurrentAlerts();
      const alert = currentAlerts[index];

      // If it's a temporary alert (not saved), just remove it locally
      if (alert.id && typeof alert.id === "string" && alert.id.startsWith("temp-")) {
        updateAlerts(currentAlerts.filter((_, i) => i !== index));
        return;
      }

      // If it's a saved alert, delete it from the server
      if (!assetId || !alert.id) {
        toast.error("Cannot delete alert: missing asset ID or alert ID");
        return;
      }

      try {
        const transformedAlert = transformToCalendarAlertCreateUpdateDto(alert);
        const result = await apiClient.deleteCalendarAlert(assetId, transformedAlert);

        if (result.status === 204) {
          toast.success("Calendar alert deleted successfully");
          updateAlerts(currentAlerts.filter((_, i) => i !== index));
        } else {
          toast.error("Failed to delete calendar alert");
        }
      } catch (error) {
        console.error("Error deleting calendar alert:", error);
        toast.error("Failed to delete calendar alert");
      }
    },
    [getCurrentAlerts, updateAlerts, assetId, apiClient]
  );

  /**
   * Update a specific field of an alert
   */
  const updateAlertField = useCallback(
    <K extends keyof CalendarAlert>(
      index: number,
      field: K,
      value: CalendarAlert[K]
    ) => {
      const currentAlerts = getCurrentAlerts();
      const updatedAlerts = currentAlerts.map((alert, i) =>
        i === index ? { ...alert, [field]: value } : alert
      );
      updateAlerts(updatedAlerts);
    },
    [getCurrentAlerts, updateAlerts]
  );

  /**
   * Update alert date
   */
  const updateAlertDate = useCallback(
    (index: number, date: string) => {
      updateAlertField(index, "date", date);
    },
    [updateAlertField]
  );

  /**
   * Update alert message
   */
  const updateAlertMessage = useCallback(
    (index: number, message: string) => {
      updateAlertField(index, "message", message);
    },
    [updateAlertField]
  );

  /**
   * Update alert assigned user
   */
  const updateAlertUser = useCallback(
    (index: number, userId: string, users: any[]) => {
      const selectedUser = userId ? users.find((person) => person.id.toString() === userId) : null;
      updateAlertField(index, "assigned_to", selectedUser || null);
    },
    [updateAlertField]
  );

  /**
   * Save/confirm an alert (create or update)
   * For new assets (no assetId), alerts are stored locally and will be created after asset creation
   * For existing assets, alerts are created/updated immediately
   */
  const confirmAlert = useCallback(
    async (index: number) => {
      const currentAlerts = getCurrentAlerts();
      const alert = currentAlerts[index];

      // Validate required fields
      if (!alert.date || !alert.message) {
        toast.error("Please fill in all required fields");
        return;
      }

      // If asset doesn't exist yet (creating new asset), just validate and mark as ready
      // The alert will be created after the asset is created
      if (!assetId) {
        toast.success("Alert will be created when you save the asset");
        return;
      }

      // For existing assets, create/update immediately
      try {
        const transformedAlert = transformToCalendarAlertCreateUpdateDto(alert);

        // Update existing alert
        if (alert.id && typeof alert.id === "number") {
          const result = await apiClient.updateCalendarAlert(assetId, transformedAlert);
          if (result.data) {
            toast.success("Calendar alert updated successfully");
          } else {
            toast.error("Failed to update calendar alert");
          }
        }
        // Create new alert
        else if (alert.id && typeof alert.id === "string" && alert.id.startsWith("temp-")) {
          const result = await apiClient.createCalendarAlert(assetId, transformedAlert);
          if (result.data) {
            toast.success("Calendar alert created successfully");
            // Update the alert with the server response ID if available
            const updatedAlerts = currentAlerts.map((a, i) =>
              i === index ? { ...a, id: result.data?.id || a.id } : a
            );
            updateAlerts(updatedAlerts);
          } else {
            toast.error("Failed to create calendar alert");
          }
        }
      } catch (error) {
        console.error("Error saving calendar alert:", error);
        toast.error("Failed to save calendar alert");
      }
    },
    [getCurrentAlerts, updateAlerts, assetId, apiClient]
  );

  /**
   * Create all calendar alerts for a newly created asset
   * This is called after the asset is created
   */
  const createAllAlerts = useCallback(
    async (newAssetId: number | string) => {
      const currentAlerts = getCurrentAlerts();
      const validAlerts = currentAlerts.filter(
        (alert) => alert.date && alert.message && alert.date.trim() !== "" && alert.message.trim() !== ""
      );

      if (validAlerts.length === 0) {
        return { success: true, created: 0 };
      }

      const results = await Promise.allSettled(
        validAlerts.map(async (alert) => {
          const transformedAlert = transformToCalendarAlertCreateUpdateDto(alert);
          return apiClient.createCalendarAlert(newAssetId, transformedAlert);
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled" && r.value.data).length;
      const failed = results.length - successful;

      if (failed > 0) {
        console.error(`Failed to create ${failed} calendar alert(s)`);
      }

      return { success: failed === 0, created: successful, failed };
    },
    [getCurrentAlerts, apiClient]
  );

  return {
    addAlert,
    removeAlert,
    updateAlertDate,
    updateAlertMessage,
    updateAlertUser,
    confirmAlert,
    createAllAlerts,
  };
}

