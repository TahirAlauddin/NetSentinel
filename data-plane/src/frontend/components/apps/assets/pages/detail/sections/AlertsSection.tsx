"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Plus, Bell } from "lucide-react";

interface AlertsSectionProps {
  alerts: Array<{ type: string; message: string }>;
  onAdd: () => void;
}

export function AlertsSection({ alerts, onAdd }: AlertsSectionProps) {
  return (
    <section id="alerts">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
        <Button variant="ghost" size="icon">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      <Card className="p-4 md:p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-900 font-medium mb-2">No alerts yet.</p>
            <button
              className="text-blue-600 flex items-center gap-1 mx-auto"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              Add an alert
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Bell className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 capitalize">{alert.type}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                </div>
              </div>
            ))}
            <button
              className="text-blue-600 text-sm flex items-center gap-1 mt-2"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              Add another alert
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}

