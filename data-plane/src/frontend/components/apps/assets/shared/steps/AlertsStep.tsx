"use client";

import { useAlertsStep } from "../../hooks/useFormDataFetch";
import { useFormPeopleFetch } from "../../hooks/useFormDataFetch";
import { CalendarAlert } from "@/types/assets/fields";
import { useCalendarAlerts } from "../../hooks/useCalendarAlerts";
import { CalendarAlertCard } from "./alerts/CalendarAlertCard";
import { EmptyAlertsState } from "./alerts/EmptyAlertsState";
import { AddAlertButton } from "./alerts/AddAlertButton";

/**
 * Alerts step component
 * Manages calendar alerts for an asset
 */
export function AlertsStep() {
  const { people, loading: loadingPeople, error: peopleError } = useFormPeopleFetch();
  const { formData, onInputChange } = useAlertsStep();

  const alerts: CalendarAlert[] = Array.isArray(formData.calendar_alerts)
    ? formData.calendar_alerts
    : [];

  // Custom hook for managing calendar alerts
  const {
    addAlert,
    removeAlert,
    updateAlertDate,
    updateAlertMessage,
    updateAlertUser,
    confirmAlert,
  } = useCalendarAlerts({
    alerts,
    assetId: formData.asset_id,
    onAlertsChange: (updatedAlerts) => {
      onInputChange("calendar_alerts", updatedAlerts);
    },
  });

  const handleUserChange = (index: number, userId: string) => {
    updateAlertUser(index, userId, people);
  };

  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Alerts</h2>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Calendar Alerts</h3>

        {alerts.length === 0 ? (
          <EmptyAlertsState onAddAlert={addAlert} />
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <CalendarAlertCard
                key={alert.id || index}
                alert={alert}
                index={index}
                people={people}
                loadingPeople={loadingPeople}
                peopleError={peopleError}
                onDateChange={updateAlertDate}
                onUserChange={handleUserChange}
                onMessageChange={updateAlertMessage}
                onRemove={removeAlert}
                onConfirm={confirmAlert}
              />
            ))}

            <AddAlertButton onAddAlert={addAlert} />
          </div>
        )}
      </div>
    </div>
  );
}
