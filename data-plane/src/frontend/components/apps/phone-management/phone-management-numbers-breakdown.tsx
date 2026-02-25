"use client";

import { Card, CardContent } from "@/components/ui/card";
import type {
  ServiceTypeSlice,
  LocationBarItem,
  ServiceTypeCategory,
} from "@/lib/phone-management/overview";
import { PhoneManagementServiceTypePieChart } from "./phone-management-service-type-pie-chart";
import { PhoneManagementLocationBarChart } from "./phone-management-location-bar-chart";

export interface PhoneManagementOverviewData {
  at_glance: { total_numbers: number };
  by_service_type: ServiceTypeSlice[];
  by_location: LocationBarItem[];
  service_type_categories: ServiceTypeCategory[];
}

interface PhoneManagementNumbersBreakdownProps {
  overview: PhoneManagementOverviewData;
  loading?: boolean;
}

export function PhoneManagementNumbersBreakdown({
  overview,
  loading = false,
}: PhoneManagementNumbersBreakdownProps) {
  return (
    <Card>
      <CardContent className="p-6 pt-6">
        <h2 className="text-xl font-semibold mb-6">Numbers breakdown</h2>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-10 min-w-0">
          <PhoneManagementServiceTypePieChart
            data={overview.by_service_type}
            totalNumbers={overview.at_glance.total_numbers}
            loading={loading}
          />
          <PhoneManagementLocationBarChart
            data={overview.by_location}
            loading={loading}
          />
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Service types
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
            {(loading ? [] : overview.service_type_categories).map((cat) => {
              const slice = overview.by_service_type.find(
                (s) => s.name === cat.name
              );
              return (
                <div
                  key={cat.name}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          slice?.color ?? "hsl(var(--muted-foreground))",
                      }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
