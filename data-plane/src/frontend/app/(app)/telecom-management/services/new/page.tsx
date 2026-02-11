"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { ServiceForm } from "@/components/telecom/service-form";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import type { DataCircuitCreateDto, DataCircuitRecord } from "@/types/data-circuits";
import type { ProviderRecord } from "@/types/providers";
import type { LocationRecord } from "@/types/locations";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function listProviders(): Promise<ProviderRecord[]> {
  const api = new TelecomApiClient();
  const res = await api.getProviders<ProviderRecord[] | { results: ProviderRecord[] }>();
  if (res.error || !res.data) return [];
  const d = res.data;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: ProviderRecord[] }).results))
    return (d as { results: ProviderRecord[] }).results;
  return Array.isArray(d) ? d : [];
}

async function listLocations(): Promise<LocationRecord[]> {
  const api = new InfrastructureApiClient();
  const res = await api.getLocations<LocationRecord[] | { results: LocationRecord[] }>();
  if (res.error || !res.data) return [];
  const d = res.data;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: LocationRecord[] }).results))
    return (d as { results: LocationRecord[] }).results;
  return Array.isArray(d) ? d : [];
}

async function createService(data: DataCircuitCreateDto): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const res = await api.createDataCircuit(data);
  if (res.error || !res.data) return { success: false, error: res.error || "Failed to create service" };
  return { success: true, message: "Service created successfully" };
}

export default function NewServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProviderId = searchParams?.get("provider") ?? "";
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoading(true);
      try {
        const [pList, lList] = await Promise.all([listProviders(), listLocations()]);
        setProviders(pList);
        setLocations(lList);
      } catch (e) {
        setProviders([]);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const handleSubmit = async (data: DataCircuitCreateDto) => {
    setSubmitting(true);
    try {
      const result = await createService(data);
      if (result.success) {
        toast.success(result.message);
        router.push("/telecom-management/services");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultProvider = preselectedProviderId ? parseInt(preselectedProviderId, 10) : NaN;
  const defaultValues =
    Number.isFinite(defaultProvider) ? ({ provider: defaultProvider } as Partial<DataCircuitRecord>) : undefined;

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">Loading...</div>
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
              { label: "Services", href: "/telecom-management/services" },
              { label: "Add Service" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Add Service</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a new telecom service (data circuit).
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Service details</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceForm
                defaultValues={defaultValues as { provider?: number }}
                providers={providers}
                locations={locations}
                onSubmit={handleSubmit}
                submitLabel="Add Service"
                cancelHref="/telecom-management/services"
                isSubmitting={submitting}
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
