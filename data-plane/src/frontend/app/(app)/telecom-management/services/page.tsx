"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
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
import { DataCircuitRecord } from "@/types/data-circuits";
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

async function listDataCircuits(): Promise<DataCircuitRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getDataCircuits<DataCircuitRecord[] | { results: DataCircuitRecord[] }>();
  if (res.error || !res.data) return [];
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

export default function ServicesPage() {
  const { data: session } = useSession();
  const [circuits, setCircuits] = useState<DataCircuitRecord[]>([]);
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
        const [cList, pList] = await Promise.all([
          listDataCircuits(),
          listProviders(),
        ]);
        setCircuits(cList);
        setProviders(pList);
      } catch (e) {
        setCircuits([]);
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
    if (!searchTerm.trim()) return circuits;
    const q = searchTerm.toLowerCase();
    return circuits.filter(
      (c) =>
        (c.circuit_id && c.circuit_id.toLowerCase().includes(q)) ||
        (c.alternate_cid && c.alternate_cid.toLowerCase().includes(q)) ||
        (c.provider_name && c.provider_name.toLowerCase().includes(q)) ||
        (c.account_number && c.account_number.toLowerCase().includes(q)) ||
        (c.carrier && c.carrier.toLowerCase().includes(q))
    );
  }, [circuits, searchTerm]);

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
            <Button asChild>
              <Link href="/telecom-management/services/new">Add Service</Link>
            </Button>
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
                  {paginated.map((circuit) => {
                    const provider = circuit.provider ? providerMap.get(circuit.provider) : null;
                    const logoUrl = getSafeAbsoluteUrl(provider?.logo_url);
                    const name =
                      circuit.circuit_id || circuit.alternate_cid || `Circuit #${circuit.id}`;
                    const typeLabel = circuit.circuit_type_display || "Data";
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
                              <p className="text-sm text-muted-foreground truncate">{name}</p>
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
                  {paginated.map((circuit) => {
                    const name =
                      circuit.circuit_id || circuit.alternate_cid || `Circuit #${circuit.id}`;
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
                            <span className="text-muted-foreground truncate">{name}</span>
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
