"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import type {
  ManagedPhoneNumberRecord,
  ManagedPhoneNumberBlockRecord,
} from "@/types/phone-management";
import {
  computePhoneManagementOverview,
  type PhoneManagementAtGlance,
} from "@/lib/phone-management/overview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Layers, Plus } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const AT_GLANCE_LABELS: Array<{
  key: keyof PhoneManagementAtGlance;
  label: string;
  color: string;
}> = [
  { key: "total_numbers", label: "Managed numbers", color: "text-foreground" },
  { key: "total_blocks", label: "Number blocks", color: "text-foreground" },
  { key: "unassigned", label: "Unassigned", color: "text-muted-foreground" },
  { key: "did_enabled", label: "DID enabled", color: "text-primary" },
  {
    key: "locations_with_numbers",
    label: "Locations",
    color: "text-muted-foreground",
  },
];

interface ListResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

async function fetchAllNumbers(
  api: PhoneManagementApiClient
): Promise<ManagedPhoneNumberRecord[]> {
  const res = await api.getManagedNumbers<
    ListResponse<ManagedPhoneNumberRecord> | ManagedPhoneNumberRecord[]
  >({ page_size: 1000 });
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as ListResponse<ManagedPhoneNumberRecord>).results ?? [];
}

async function fetchAllBlocks(
  api: PhoneManagementApiClient
): Promise<ManagedPhoneNumberBlockRecord[]> {
  const res = await api.getManagedBlocks<
    ListResponse<ManagedPhoneNumberBlockRecord> | ManagedPhoneNumberBlockRecord[]
  >({ page_size: 1000 });
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as ListResponse<ManagedPhoneNumberBlockRecord>).results ?? [];
}

export default function PhoneManagementPage() {
  const { data: session } = useSession();
  const [numbers, setNumbers] = useState<ManagedPhoneNumberRecord[]>([]);
  const [blocks, setBlocks] = useState<ManagedPhoneNumberBlockRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const api = useMemo(() => new PhoneManagementApiClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [numList, blockList] = await Promise.all([
      fetchAllNumbers(api),
      fetchAllBlocks(api),
    ]);
    setNumbers(numList);
    setBlocks(blockList);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchData();
    });
    return () => {
      cancelled = true;
    };
  }, [session, fetchData]);

  const overview = useMemo(
    () => computePhoneManagementOverview(numbers, blocks),
    [numbers, blocks]
  );

  const at_glance = overview.at_glance;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[{ label: "Phone Management", href: "/phone-management" }]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Phone Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage individual phone numbers and number blocks by location.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm" className="gap-2">
                <Link href="/phone-management/numbers/new">
                  <Plus className="w-4 h-4" />
                  Add number
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/phone-management/blocks/new">
                  <Plus className="w-4 h-4" />
                  Add block
                </Link>
              </Button>
            </div>
          </div>

          {/* At a glance - KPI cards */}
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
                        {at_glance[key]}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Charts: Service type (pie) + Numbers by location (bar) */}
          <Card>
            <CardContent className="p-6 pt-6">
              <h2 className="text-xl font-semibold mb-6">
                Numbers breakdown
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-10 min-w-0">
                {/* Pie: by service type */}
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    By service type
                  </h3>
                  <div
                    className="relative flex items-center justify-center"
                    style={{ height: 320 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overview.by_service_type}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {overview.by_service_type.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [value, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                      aria-hidden
                    >
                      <div className="text-2xl font-semibold text-foreground">
                        {loading ? "—" : overview.at_glance.total_numbers}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Total numbers
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar: by location (top 10) */}
                <div className="min-w-0 min-h-[340px]">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Top locations (managed numbers)
                  </h3>
                  {loading ? (
                    <div
                      className="flex items-center justify-center text-muted-foreground"
                      style={{ height: 320 }}
                    >
                      —
                    </div>
                  ) : overview.by_location.length === 0 ? (
                    <div
                      className="flex items-center justify-center text-muted-foreground"
                      style={{ height: 320 }}
                    >
                      No data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={overview.by_location}
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          horizontal={false}
                          vertical
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value: number) => [value, "Numbers"]}
                        />
                        <Bar
                          dataKey="count"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={32}
                          fill="hsl(var(--primary))"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Service type legend */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Service types
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
                  {(loading ? [] : overview.service_type_categories).map(
                    (cat) => {
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
                    }
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" size="lg" asChild className="gap-2">
              <Link href="/phone-management/numbers">
                <Phone className="w-5 h-5" />
                Managed Numbers
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="gap-2">
              <Link href="/phone-management/blocks">
                <Layers className="w-5 h-5" />
                Number Blocks
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="transition-colors hover:bg-muted/50">
              <Link href="/phone-management/numbers" className="block">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Managed Numbers
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Individual phone numbers with extension, service type, DID,
                    and assignment.
                  </p>
                  <p className="text-xs text-primary mt-2">View all →</p>
                </CardContent>
              </Link>
            </Card>
            <Card className="transition-colors hover:bg-muted/50">
              <Link href="/phone-management/blocks" className="block">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Number Blocks
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ranges of numbers at a location for bulk management.
                  </p>
                  <p className="text-xs text-primary mt-2">View all →</p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
