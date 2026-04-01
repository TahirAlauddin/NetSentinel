"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import type { ManagedPhoneNumberBlockRecord } from "@/types/phone-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

async function getManagedBlock(
  id: string
): Promise<ManagedPhoneNumberBlockRecord | null> {
  const api = new PhoneManagementApiClient();
  const res = await api.getManagedBlock<ManagedPhoneNumberBlockRecord>(id);
  if (res.error || !res.data) return null;
  return res.data;
}

export default function ManagedBlockDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [record, setRecord] = useState<ManagedPhoneNumberBlockRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      const r = await getManagedBlock(id);
      setRecord(r ?? null);
      setLoading(false);
    })();
  }, [session, id]);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="phone_management.view_managedphonenumberblock">
        <AppShell>
          <div className="flex-1 p-6">Loading…</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!record) {
    return (
      <ProtectedRoute requiredPermission="phone_management.view_managedphonenumberblock">
        <AppShell>
          <div className="flex-1 p-6">
            <p className="text-muted-foreground">Number block not found.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/phone-management/blocks">Back to Number Blocks</Link>
            </Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="phone_management.view_managedphonenumberblock">
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Phone Management", href: "/phone-management" },
              { label: "Number Blocks", href: "/phone-management/blocks" },
              { label: record.name },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{record.name}</h1>
              <p className="text-muted-foreground">
                {record.start_number} – {record.end_number}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/phone-management/blocks/${record.id}/edit`}
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
                    Location
                  </p>
                  <p>{record.location_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start number
                  </p>
                  <p>{record.start_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End number
                  </p>
                  <p>{record.end_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Static assignment
                  </p>
                  <p>{record.is_static_assignment ? "Yes" : "No"}</p>
                </div>
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
