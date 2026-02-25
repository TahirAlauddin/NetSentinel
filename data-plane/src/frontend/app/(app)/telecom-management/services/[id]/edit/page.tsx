"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { ServiceForm } from "@/components/apps/telecom/service-form";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import type { ServiceRecord, ServiceCreateDto } from "@/types/services";
import type { ProviderRecord } from "@/types/providers";
import type { LocationRecord } from "@/types/locations";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getService(id: string): Promise<ServiceRecord | null> {
  const api = new TelecomApiClient();
  const res = await api.getService<ServiceRecord>(id);
  if (res.error || !res.data) return null;
  return res.data as ServiceRecord;
}

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

async function updateService(
  id: string,
  data: ServiceCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const res = await api.updateService(id, data);
  if (res.error || !res.data) return { success: false, error: res.error || "Failed to update service" };
  return { success: true, message: "Service updated successfully" };
}

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      try {
        const [s, pList, lList] = await Promise.all([
          getService(id),
          listProviders(),
          listLocations(),
        ]);
        setService(s ?? null);
        setProviders(pList);
        setLocations(lList);
      } catch (_e) {
        setService(null);
        setProviders([]);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, id]);

  const handleSubmit = async (data: ServiceCreateDto) => {
    setSubmitting(true);
    try {
      const result = await updateService(id, data);
      if (result.success) {
        toast.success(result.message);
        router.push(`/telecom-management/services/${id}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (_e) {
      console.error(_e);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Services", href: "/telecom-management/services" },
              { label: service.name, href: `/telecom-management/services/${service.id}` },
              { label: "Edit" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Edit Service</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Update {service.name}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Service details</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceForm
                key={service.id}
                defaultValues={{
                  name: service.name,
                  provider: service.provider,
                  location: service.location,
                  service_category: service.service_category,
                  service_type: service.service_type,
                  associated_product: service.associated_product,
                  account_number: service.account_number,
                  security_code: service.security_code,
                  contract_id: service.contract_id,
                  monthly_cost: service.monthly_cost,
                  notes: service.notes,
                }}
                providers={providers}
                locations={locations}
                onSubmit={handleSubmit}
                submitLabel="Save changes"
                cancelHref={`/telecom-management/services/${service.id}`}
                isSubmitting={submitting}
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
