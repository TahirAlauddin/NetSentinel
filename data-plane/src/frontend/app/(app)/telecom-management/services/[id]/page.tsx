"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { ServiceRecord } from "@/types/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

async function getService(id: string): Promise<ServiceRecord | null> {
  const api = new TelecomApiClient();
  const res = await api.getService<ServiceRecord>(id);
  if (res.error || !res.data) return null;
  return res.data as ServiceRecord;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      try {
        const s = await getService(id);
        setService(s ?? null);
      } catch (_e) {
        setService(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">Loading...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!service) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Service not found.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/telecom-management/services">Back to Services</Link>
            </Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const monthlyCost = service.monthly_cost
    ? formatCurrency(parseFloat(service.monthly_cost))
    : null;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Services", href: "/telecom-management/services" },
              { label: service.name },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{service.name}</h1>
              {service.provider_name && (
                <p className="text-muted-foreground text-sm mt-1">
                  {service.provider_name}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/telecom-management/services/${service.id}/edit`}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Link>
            </Button>
          </div>

          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthlyCost && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                  <p>{monthlyCost}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Associated Product</p>
                <p>{service.associated_product ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Category</p>
                <p>{service.service_category_display ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                <p>{service.service_type_display ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Locations</p>
                <p>{service.location_name ?? "—"}</p>
              </div>
              {service.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{service.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account & Contract */}
          <Card>
            <CardHeader>
              <CardTitle>Account & Contract</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                <p>{service.account_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pin</p>
                <p>{service.security_code ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contract</p>
                <p>{service.contract_id ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
