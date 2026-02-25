"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { ProviderForm } from "@/components/apps/telecom/provider-form";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import type { ProviderRecord, ProviderCreateDto } from "@/types/providers";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getProvider(id: string): Promise<ProviderRecord | null> {
  const api = new TelecomApiClient();
  const res = await api.getProvider<ProviderRecord>(id);
  if (res.error || !res.data) return null;
  return res.data as ProviderRecord;
}

async function updateProvider(
  id: string,
  data: ProviderCreateDto
): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const res = await api.updateProvider(id, data);
  if (res.error || !res.data) {
    return { success: false, error: res.error || "Failed to update provider" };
  }
  return { success: true, message: "Provider updated successfully" };
}

export default function EditProviderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      try {
        const p = await getProvider(id);
        setProvider(p ?? null);
      } catch {
        setProvider(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, id]);

  const handleSubmit = async (data: ProviderCreateDto) => {
    if (!data.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateProvider(id, data);
      if (result.success) {
        toast.success(result.message);
        router.push(`/telecom-management/providers/${id}`);
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
              { label: provider.name, href: `/telecom-management/providers/${provider.id}` },
              { label: "Edit" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Edit Provider</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Update {provider.name}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Provider details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderForm
                defaultValues={{
                  name: provider.name,
                  description: provider.description,
                  service_type: provider.service_type,
                  status: provider.status,
                  account_number: provider.account_number,
                  contact_name: provider.contact_name,
                  contact_email: provider.contact_email,
                  contact_phone: provider.contact_phone,
                  website: provider.website,
                  logo_url: provider.logo_url,
                  monthly_cost: provider.monthly_cost,
                  notes: provider.notes,
                }}
                onSubmit={handleSubmit}
                submitLabel="Save changes"
                cancelHref={`/telecom-management/providers/${provider.id}`}
                isSubmitting={submitting}
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
