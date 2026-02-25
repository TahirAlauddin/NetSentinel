"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AT_GLANCE_LABELS } from "@/lib/phone-management/constants";
import type { PhoneManagementAtGlance } from "@/lib/phone-management/overview";

interface PhoneManagementAtGlanceKpisProps {
  atGlance: PhoneManagementAtGlance;
  loading?: boolean;
}

export function PhoneManagementAtGlanceKpis({
  atGlance,
  loading = false,
}: PhoneManagementAtGlanceKpisProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">At a glance</h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {AT_GLANCE_LABELS.map(({ label }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">
                  {label}
                </div>
                <div className="text-3xl font-semibold animate-pulse text-muted-foreground">
                  —
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {AT_GLANCE_LABELS.map(({ key, label, color }) => (
            <Card key={key}>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">
                  {label}
                </div>
                <div className={`text-3xl font-semibold ${color}`}>
                  {atGlance[key]}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
