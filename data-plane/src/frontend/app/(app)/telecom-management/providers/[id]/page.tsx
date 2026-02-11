"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { ProviderRecord } from "@/types/providers";
import { DataCircuitRecord } from "@/types/data-circuits";
import { getSafeAbsoluteUrl } from "@/lib/security/url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

async function getProvider(id: string): Promise<ProviderRecord | null> {
  const api = new TelecomApiClient();
  const res = await api.getProvider<ProviderRecord>(id);
  if (res.error || !res.data) return null;
  return res.data as ProviderRecord;
}

async function getProviderCircuits(providerId: number): Promise<DataCircuitRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getDataCircuits<DataCircuitRecord[] | { results: DataCircuitRecord[] }>({
    provider: providerId,
  });
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

const NAV_ITEMS = [
  { label: "Overview", href: "overview" },
  { label: "Services", href: "services" },
  { label: "IP Addresses", href: "ip-addresses" },
] as const;

export default function ProviderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const tabParam = searchParams?.get("tab") || "overview";
  const tab = (["overview", "services", "ip-addresses"].includes(tabParam) ? tabParam : "overview") as "overview" | "services" | "ip-addresses";
  const { data: session } = useSession();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [circuits, setCircuits] = useState<DataCircuitRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      try {
        const p = await getProvider(id);
        setProvider(p ?? null);
        if (p) {
          const list = await getProviderCircuits(p.id);
          setCircuits(list);
        }
      } catch (e) {
        setProvider(null);
        setCircuits([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, id]);

  const monthlyCost = provider?.monthly_cost ? parseFloat(provider.monthly_cost) : 0;
  const circuitsMonthly = circuits.reduce((sum, c) => sum + (c.monthly_cost ? parseFloat(c.monthly_cost) : 0), 0);
  const totalMonthly = monthlyCost + circuitsMonthly;
  const avgMonthly = totalMonthly;
  const mtd = totalMonthly;
  const ytd = totalMonthly * 12;
  const totalSpend = ytd;


  const logoUrl = provider ? getSafeAbsoluteUrl(provider.logo_url) : null;

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!provider) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Provider not found.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/telecom-management/providers">Back to Providers</Link>
            </Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Providers", href: "/telecom-management/providers" },
              { label: provider.name },
            ]}
          />

          {/* Header with provider name, logo, KPIs */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={provider.name}
                  className="w-14 h-14 object-contain rounded border"
                />
              ) : (
                <div className="w-14 h-14 rounded border bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground">
                  {provider.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{provider.name}</h1>
                {provider.service_type_display && (
                  <p className="text-muted-foreground text-sm">{provider.service_type_display}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/telecom-management/providers/${provider.id}/edit`} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Avg. Monthly Cost*
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{formatCurrency(avgMonthly)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  MTD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{formatCurrency(mtd)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  YTD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{formatCurrency(ytd)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{formatCurrency(totalSpend)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-6">
            {/* Sidebar nav */}
            <nav className="w-48 flex-shrink-0 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = tab === item.href;
                const href =
                  item.href === "overview"
                    ? `/telecom-management/providers/${provider.id}`
                    : `/telecom-management/providers/${provider.id}?tab=${item.href}`;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "block py-2 px-3 rounded-md text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1 min-w-0">
              {tab === "overview" && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p>{provider.status_display ?? provider.status}</p>
                      </div>
                      {provider.account_number && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                          <p>{provider.account_number}</p>
                        </div>
                      )}
                      {provider.contact_name && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Contact</p>
                          <p>
                            {provider.contact_name}
                            {provider.contact_email && ` (${provider.contact_email})`}
                            {provider.contact_phone && ` — ${provider.contact_phone}`}
                          </p>
                        </div>
                      )}
                      {provider.website && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Website</p>
                          <a
                            href={getSafeAbsoluteUrl(provider.website) ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {provider.website}
                          </a>
                        </div>
                      )}
                    </div>
                    {provider.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="whitespace-pre-wrap">{provider.description}</p>
                      </div>
                    )}
                    {provider.notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="whitespace-pre-wrap">{provider.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {tab === "services" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Services</CardTitle>
                    <Button size="sm" asChild>
                      <Link href={`/telecom-management/services/new?provider=${provider.id}`}>
                        Add Service
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {circuits.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">
                        No services linked to this provider.{" "}
                        <Link
                          href={`/telecom-management/services/new?provider=${provider.id}`}
                          className="text-primary hover:underline"
                        >
                          Add a service
                        </Link>
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {circuits.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={`/telecom-management/services/${c.id}`}
                              className="flex items-center justify-between py-3 hover:bg-muted/30 rounded-md px-2"
                            >
                              <span className="font-medium">
                                {c.circuit_id || c.alternate_cid || `Circuit #${c.id}`}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {c.monthly_cost
                                  ? formatCurrency(parseFloat(c.monthly_cost)) + " /mon"
                                  : "—"}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {tab === "ip-addresses" && (
                <Card>
                  <CardHeader>
                    <CardTitle>IP Addresses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">No IP addresses linked. Coming soon.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
