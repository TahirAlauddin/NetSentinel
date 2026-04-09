"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { ProviderRecord } from "@/types/providers";
import { ServiceRecord } from "@/types/services";
import { Can } from "@/contexts/permissions-context";
import { getSafeAbsoluteUrl } from "@/lib/security/url";
import { Search } from "lucide-react";

async function listProviders(): Promise<ProviderRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getProviders<ProviderRecord[] | { results: ProviderRecord[] }>();
  if (res.error || !res.data) return [];
  const d = res.data;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: ProviderRecord[] }).results))
    return (d as { results: ProviderRecord[] }).results;
  return Array.isArray(d) ? d : [];
}

async function listServices(): Promise<ServiceRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getServices<ServiceRecord[] | { results: ServiceRecord[] }>();
  if (res.error || !res.data) return [];
  const d = res.data;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: ServiceRecord[] }).results))
    return (d as { results: ServiceRecord[] }).results;
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

export default function ServicesPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoading(true);
      try {
        const [sList, pList] = await Promise.all([
          listServices(),
          listProviders(),
        ]);
        setServices(sList);
        setProviders(pList);
      } catch (_e) {
        setServices([]);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const providerMap = useMemo(() => {
    const m = new Map<number, ProviderRecord>();
    providers.forEach((p) => m.set(p.id, p));
    return m;
  }, [providers]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return services;
    const q = searchTerm.toLowerCase();
    return services.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.provider_name && s.provider_name.toLowerCase().includes(q)) ||
        (s.account_number && s.account_number.toLowerCase().includes(q)) ||
        (s.location_name && s.location_name.toLowerCase().includes(q))
    );
  }, [services, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Services" },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Telecom Expense Management</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your telecom services.
              </p>
            </div>
            <Can permission="telecom.add_service">
              <Button asChild>
                <Link href="/telecom-management/services/new">Add Service</Link>
              </Button>
            </Can>
          </div>

          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Services</CardTitle>
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </CardHeader>
            <CardContent className="p-4">
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
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Results per page</span>
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
              ) : paginated.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No services found.{" "}
                  <Link href="/telecom-management/services/new" className="text-primary hover:underline">
                    Add a service
                  </Link>
                  .
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.map((svc) => {
                    const provider = svc.provider ? providerMap.get(svc.provider) : null;
                    const logoUrl = getSafeAbsoluteUrl(provider?.logo_url);
                    const typeLabel = svc.service_type_display || svc.service_category_display || "Service";
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
                            <p className="text-sm font-medium whitespace-nowrap">{monthly} /mon</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <ul className="divide-y">
                  {paginated.map((svc) => {
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
                    {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
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
