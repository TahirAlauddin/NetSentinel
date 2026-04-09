"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { Search, X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTelecomOverview } from "@/hooks/useTelecomOverview";
import { getSafeAbsoluteUrl } from "@/lib/security/url";

const COLORS = ["#2E7CF6", "#16A085", "#8B6FD9"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function TelecomServicesOverview() {
  const { services, providers, loading } = useTelecomOverview();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredServices = useMemo(() => {
    let list = services;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.provider_name && s.provider_name.toLowerCase().includes(q)) ||
          (s.account_number && s.account_number.toLowerCase().includes(q)) ||
          (s.location_name && s.location_name.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      // Future extension: filter by status when available
    }
    return list;
  }, [services, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const paginatedServices = useMemo(
    () =>
      filteredServices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredServices, currentPage, itemsPerPage]
  );

  const providerMap = useMemo(() => {
    const m = new Map<number, (typeof providers)[number]>();
    providers.forEach((p) => m.set(p.id, p));
    return m;
  }, [providers]);

  const donutData = useMemo(
    () => [
      { name: "Data", value: services.filter((s) => s.service_category_display === "Data").length },
      { name: "Voice", value: services.filter((s) => s.service_category_display === "Voice").length },
      {
        name: "Consolidated",
        value: services.filter((s) => s.service_category_display === "Consolidated").length,
      },
    ],
    [services]
  );

  return (
    <Card>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Services</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/telecom-management/services">View all / Manage</Link>
            </Button>
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
          <div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service name, provider, or account..."
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
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : paginatedServices.length === 0 ? (
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
                {paginatedServices.map((svc) => {
                  const provider = svc.provider ? providerMap.get(svc.provider) : null;
                  const logoUrl = getSafeAbsoluteUrl(provider?.logo_url);
                  const typeLabel =
                    svc.service_type_display || svc.service_category_display || "Service";
                  const monthly = svc.monthly_cost
                    ? formatCurrency(parseFloat(svc.monthly_cost))
                    : null;
                  return (
                    <Link
                      key={svc.id}
                      href={`/telecom-management/services/${svc.id}`}
                      className="block border rounded-lg p-4 hover:border-primary hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={svc.provider_name || "Provider"}
                              className="w-10 h-10 object-contain rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground flex-shrink-0">
                              {(svc.name || "?")[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{svc.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {svc.provider_name || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">• {typeLabel}</p>
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
                {paginatedServices.map((svc) => {
                  const monthly = svc.monthly_cost
                    ? formatCurrency(parseFloat(svc.monthly_cost))
                    : "—";
                  return (
                    <li key={svc.id}>
                      <Link
                        href={`/telecom-management/services/${svc.id}`}
                        className="flex items-center justify-between py-3 px-2 hover:bg-muted/30 rounded-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-medium truncate">{svc.name}</span>
                          <span className="text-muted-foreground truncate">
                            {svc.provider_name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {svc.service_type_display || svc.service_category_display || "—"}
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
                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredServices.length)} of{" "}
                  {filteredServices.length}
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
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Service Distribution
            </p>
            <div className="w-full h-[260px]">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

