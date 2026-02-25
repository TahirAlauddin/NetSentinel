"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { ProviderForm } from "@/components/apps/telecom/provider-form";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import type { ProviderCreateDto } from "@/types/providers";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function createProvider(data: ProviderCreateDto): Promise<{ success: boolean; message?: string; error?: string }> {
  const api = new TelecomApiClient();
  const res = await api.createProvider(data);
  if (res.error || !res.data) {
    return { success: false, error: res.error || "Failed to create provider" };
  }
  return { success: true, message: "Provider created successfully" };
}

export default function NewProviderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: ProviderCreateDto) => {
    if (!data.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createProvider(data);
      if (result.success) {
        toast.success(result.message);
        router.push("/telecom-management/providers");
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

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Providers", href: "/telecom-management/providers" },
              { label: "Add Provider" },
            ]}
          />
          <div>
            <h1 className="text-2xl font-semibold">Add Provider</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a new telecom provider.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Provider details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderForm
                onSubmit={handleSubmit}
                submitLabel="Add Provider"
                cancelHref="/telecom-management/providers"
                isSubmitting={submitting}
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
