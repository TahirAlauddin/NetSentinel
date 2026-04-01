"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import type { ManagedPhoneNumberRecord } from "@/types/phone-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

async function getManagedNumber(
  id: string
): Promise<ManagedPhoneNumberRecord | null> {
  const api = new PhoneManagementApiClient();
  const res = await api.getManagedNumber<ManagedPhoneNumberRecord>(id);
  if (res.error || !res.data) return null;
  return res.data;
}

function formatPhoneDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return number;
}

export default function ManagedNumberDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [record, setRecord] = useState<ManagedPhoneNumberRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      const r = await getManagedNumber(id);
      setRecord(r ?? null);
      setLoading(false);
    })();
  }, [session, id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">Loading…</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!record) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Managed number not found.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/phone-management/numbers">Back to Managed Numbers</Link>
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
              { label: "Phone Management", href: "/phone-management" },
              { label: "Managed Numbers", href: "/phone-management/numbers" },
              { label: record.name },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{record.name}</h1>
              <p className="text-muted-foreground">
                {formatPhoneDisplay(record.phone_number_value)}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/phone-management/numbers/${record.id}/edit`}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone number
                  </p>
                  <p>{formatPhoneDisplay(record.number || record.phone_number_value)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Location
                  </p>
                  <p>{record.location_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Service type
                  </p>
                  <p>{record.service_type_display ?? record.service_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Extension
                  </p>
                  <p>{record.extension_number ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned user
                  </p>
                  <p>{record.assigned_user_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    DID enabled
                  </p>
                  <p>{record.did_enabled ? "Yes" : "No"}</p>
                </div>
                {record.did_enabled && record.did_external_number && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      DID external number
                    </p>
                    <p>{record.did_external_number}</p>
                  </div>
                )}
              </div>
              {record.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
