"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, Edit2, Plus } from "lucide-react";
import { ProviderRecord } from "@/types/providers";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { getSafeAbsoluteUrl } from "@/lib/security/url";
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
import { Search } from "lucide-react";

async function listProviders(): Promise<ProviderRecord[]> {
  const api = new TelecomApiClient();
  const response = await api.getProviders<
    ProviderRecord[] | { results: ProviderRecord[] }
  >();
  if (response.status === 401) throw new Error("Authentication required.");
  if (response.error || !response.data) throw new Error(response.error || "Failed to fetch providers");
  const data = response.data;
  if (data && typeof data === "object" && "results" in data && Array.isArray((data as { results: ProviderRecord[] }).results))
    return (data as { results: ProviderRecord[] }).results;
  if (Array.isArray(data)) return data;
  return [];
}

async function deleteProvider(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const response = await api.deleteProvider(id);
  if (response.error) return { success: false, error: response.error };
  return { success: true, message: "Provider deleted successfully" };
}

export default function ProvidersPage() {
  const { data: session } = useSession();
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
        const list = await listProviders();
        setProviders(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (e instanceof Error && !e.message.includes("401")) toast.error("Failed to load providers");
        setProviders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return providers;
    const q = searchTerm.toLowerCase();
    return providers.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.account_number?.toLowerCase().includes(q) ||
        p.contact_name?.toLowerCase().includes(q) ||
        p.contact_email?.toLowerCase().includes(q) ||
        p.service_type_display?.toLowerCase().includes(q)
    );
  }, [providers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this provider?")) return;
    try {
      const result = await deleteProvider(id);
      if (result.success) {
        toast.success(result.message);
        const list = await listProviders();
        setProviders(Array.isArray(list) ? list : []);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Providers" },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Providers</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your telecom providers.
              </p>
            </div>
            <Button asChild>
              <Link href="/telecom-management/providers/new" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Provider
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Providers</CardTitle>
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
                  No providers found.{" "}
                  <Link href="/telecom-management/providers/new" className="text-primary hover:underline">
                    Add a provider
                  </Link>
                  .
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.map((provider) => {
                    const logoUrl = getSafeAbsoluteUrl(provider.logo_url);
                    return (
                      <Link
                        key={provider.id}
                        href={`/telecom-management/providers/${provider.id}`}
                        className="block border rounded-lg p-4 hover:border-primary hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={provider.name}
                                className="w-10 h-10 object-contain rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground flex-shrink-0">
                                {provider.name[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{provider.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {provider.service_type_display && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                    {provider.service_type_display}
                                  </span>
                                )}
                                {provider.status_display && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      provider.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : provider.status === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {provider.status_display}
                                  </span>
                                )}
                                {provider.data_circuit_count !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    {provider.data_circuit_count} service{provider.data_circuit_count !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.preventDefault()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link href={`/telecom-management/providers/${provider.id}/edit`} onClick={(e) => e.stopPropagation()}>
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(e, provider.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {provider.monthly_cost && (
                          <p className="text-sm text-muted-foreground mt-2">
                            ${parseFloat(provider.monthly_cost).toFixed(2)} /mon
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <ul className="divide-y">
                  {paginated.map((provider) => {
                    const logoUrl = getSafeAbsoluteUrl(provider.logo_url);
                    return (
                      <li key={provider.id}>
                        <div className="flex items-center justify-between py-3 px-2 hover:bg-muted/30 rounded-md group">
                          <Link href={`/telecom-management/providers/${provider.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                            {logoUrl && (
                              <img src={logoUrl} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{provider.name}</span>
                            {provider.service_type_display && (
                              <span className="text-xs text-muted-foreground">{provider.service_type_display}</span>
                            )}
                            {provider.status_display && (
                              <span className="text-xs text-muted-foreground">{provider.status_display}</span>
                            )}
                            {provider.monthly_cost && (
                              <span className="text-sm font-medium ml-auto">
                                ${parseFloat(provider.monthly_cost).toFixed(2)} /mon
                              </span>
                            )}
                          </Link>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/telecom-management/providers/${provider.id}/edit`}>
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(e, provider.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
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
