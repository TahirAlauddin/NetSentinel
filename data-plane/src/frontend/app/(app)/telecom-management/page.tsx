"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import {
  computeTelecomKpis,
  telecomDonutData,
} from "@/lib/api-client/telecom-helpers";
import { ProviderRecord } from "@/types/providers";
import { DataCircuitRecord } from "@/types/data-circuits";
import { getSafeAbsoluteUrl } from "@/lib/security/url";
import { Search, X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#2E7CF6", "#16A085", "#8B6FD9"];

async function listProviders(): Promise<ProviderRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getProviders<ProviderRecord[] | { results: ProviderRecord[] }>();
  if (res.status === 401 || res.error || !res.data) return [];
  const d = res.data;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: ProviderRecord[] }).results))
    return (d as { results: ProviderRecord[] }).results;
  return Array.isArray(d) ? d : [];
}

async function listDataCircuits(): Promise<DataCircuitRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getDataCircuits<DataCircuitRecord[] | { results: DataCircuitRecord[] }>();
  if (res.status === 401 || res.error || !res.data) return [];
  const d = res.data;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: DataCircuitRecord[] }).results))
    return (d as { results: DataCircuitRecord[] }).results;
  return Array.isArray(d) ? d : [];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TelecomExpenseManagementPage() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [circuits, setCircuits] = useState<DataCircuitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [pList, cList] = await Promise.all([
          listProviders(),
          listDataCircuits(),
        ]);
        if (!cancelled) {
          setProviders(pList);
          setCircuits(cList);
        }
      } catch (_e) {
        if (!cancelled) {
          setProviders([]);
          setCircuits([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const kpis = useMemo(
    () => computeTelecomKpis(providers, circuits),
    [providers, circuits]
  );
  const donutData = useMemo(() => telecomDonutData(kpis), [kpis]);

  const filteredCircuits = useMemo(() => {
    let list = circuits;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          (c.circuit_id && c.circuit_id.toLowerCase().includes(q)) ||
          (c.alternate_cid && c.alternate_cid.toLowerCase().includes(q)) ||
          (c.provider_name && c.provider_name.toLowerCase().includes(q)) ||
          (c.account_number && c.account_number.toLowerCase().includes(q)) ||
          (c.carrier && c.carrier.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      // Data circuits don't have status in type; this filter is reserved for future extension.
    }
    return list;
  }, [circuits, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCircuits.length / itemsPerPage));
  const paginatedCircuits = useMemo(
    () =>
      filteredCircuits.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredCircuits, currentPage, itemsPerPage]
  );

  const providerMap = useMemo(() => {
    const m = new Map<number, ProviderRecord>();
    providers.forEach((p) => m.set(p.id, p));
    return m;
  }, [providers]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "All" },
            ]}
          />

          <div>
            <h1 className="text-3xl font-bold">Telecom Expense Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your telecom expenses, providers, and services.
            </p>
          </div>

          {/* At a glance - KPI cards */}
          <div>
            <h2 className="text-lg font-semibold mb-3">At a glance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <Card>
                <CardContent className="px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    IP Addresses
                  </p>
                  <p className="text-3xl font-semibold leading-tight mt-1">
                    {kpis.ipAddressCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Phone Numbers
                  </p>
                  <p className="text-3xl font-semibold leading-tight mt-1">
                    {kpis.phoneNumberCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Voice
                  </p>
                  <p className="text-xl font-semibold leading-tight mt-1">
                    {formatCurrency(kpis.voiceMonthly)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">/month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Data
                  </p>
                  <p className="text-xl font-semibold leading-tight mt-1">
                    {formatCurrency(kpis.dataMonthly)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">/month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Consolidated
                  </p>
                  <p className="text-xl font-semibold leading-tight mt-1">
                    {formatCurrency(kpis.consolidatedMonthly)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">/month</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Service Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <div className="w-full lg:w-[320px] h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={92}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {donutData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full">
                    <p className="text-2xl font-bold">{kpis.totalServices}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Total active services
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="flex items-center gap-2 text-sm">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[0] }}
                          />
                          Data
                        </span>
                        <span className="font-semibold">{kpis.byCategory.data}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="flex items-center gap-2 text-sm">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[1] }}
                          />
                          Voice
                        </span>
                        <span className="font-semibold">{kpis.byCategory.voice}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="flex items-center gap-2 text-sm">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[2] }}
                          />
                          Consolidated
                        </span>
                        <span className="font-semibold">
                          {kpis.byCategory.consolidated}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services (overview = list) */}
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Services</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link href="/telecom-management/services">
                      View all / Manage
                    </Link>
                  </Button>
                  <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, provider, or account number..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {statusFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setStatusFilter(null)}
                      />
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Results per page
                  </span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : paginatedCircuits.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No services found.{" "}
                  <Link
                    href="/telecom-management/services/new"
                    className="text-primary hover:underline"
                  >
                    Add a service
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/telecom-management/providers"
                    className="text-primary hover:underline"
                  >
                    manage providers
                  </Link>
                  .
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCircuits.map((circuit) => {
                    const provider = circuit.provider
                      ? providerMap.get(circuit.provider)
                      : null;
                    const logoUrl = getSafeAbsoluteUrl(provider?.logo_url);
                    const name =
                      circuit.circuit_id ||
                      circuit.alternate_cid ||
                      `Circuit #${circuit.id}`;
                    const typeLabel =
                      circuit.circuit_type_display || "Data";
                    const monthly = circuit.monthly_cost
                      ? formatCurrency(parseFloat(circuit.monthly_cost))
                      : null;
                    return (
                      <Link
                        key={circuit.id}
                        href={`/telecom-management/services/${circuit.id}`}
                        className="block border rounded-lg p-4 hover:border-primary hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={circuit.provider_name || "Provider"}
                                className="w-10 h-10 object-contain rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground flex-shrink-0">
                                {(circuit.provider_name || "?")[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {circuit.provider_name || "Unknown provider"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                • {typeLabel}
                              </p>
                            </div>
                          </div>
                          {monthly && (
                            <p className="text-sm font-medium whitespace-nowrap">
                              {monthly} /mon
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <ul className="divide-y">
                  {paginatedCircuits.map((circuit) => {
                    const name =
                      circuit.circuit_id ||
                      circuit.alternate_cid ||
                      `Circuit #${circuit.id}`;
                    const monthly = circuit.monthly_cost
                      ? formatCurrency(parseFloat(circuit.monthly_cost))
                      : "—";
                    return (
                      <li key={circuit.id}>
                        <Link
                          href={`/telecom-management/services/${circuit.id}`}
                          className="flex items-center justify-between py-3 px-2 hover:bg-muted/30 rounded-md"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-medium truncate">
                              {circuit.provider_name || "—"}
                            </span>
                            <span className="text-muted-foreground truncate">
                              {name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {circuit.circuit_type_display || "Data"}
                            </span>
                          </div>
                          <span className="font-medium">{monthly} /mon</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredCircuits.length
                    )}{" "}
                    of {filteredCircuits.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
