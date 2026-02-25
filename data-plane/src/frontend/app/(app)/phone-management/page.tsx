"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/apps/telecom/telecom-breadcrumb";
import { PhoneManagementApiClient } from "@/lib/api-client/phone-management";
import type {
  ManagedPhoneNumberRecord,
  ManagedPhoneNumberBlockRecord,
} from "@/types/phone-management";
import { computePhoneManagementOverview } from "@/lib/phone-management/overview";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PhoneManagementAtGlanceKpis } from "@/components/apps/phone-management/phone-management-at-a-glance-kpis";
import { PhoneManagementNumbersBreakdown } from "@/components/apps/phone-management/phone-management-numbers-breakdown";
import { PhoneManagementQuickLinks } from "@/components/apps/phone-management/phone-management-quick-links";
import { PhoneManagementFeatureCards } from "@/components/apps/phone-management/phone-management-feature-cards";

interface ListResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

async function fetchAllNumbers(
  api: PhoneManagementApiClient
): Promise<ManagedPhoneNumberRecord[]> {
  const res = await api.getManagedNumbers<
    ListResponse<ManagedPhoneNumberRecord> | ManagedPhoneNumberRecord[]
  >({ page_size: 1000 });
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as ListResponse<ManagedPhoneNumberRecord>).results ?? [];
}

async function fetchAllBlocks(
  api: PhoneManagementApiClient
): Promise<ManagedPhoneNumberBlockRecord[]> {
  const res = await api.getManagedBlocks<
    ListResponse<ManagedPhoneNumberBlockRecord> | ManagedPhoneNumberBlockRecord[]
  >({ page_size: 1000 });
  if (res.error || !res.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as ListResponse<ManagedPhoneNumberBlockRecord>).results ?? [];
}

export default function PhoneManagementPage() {
  const { data: session } = useSession();
  const [numbers, setNumbers] = useState<ManagedPhoneNumberRecord[]>([]);
  const [blocks, setBlocks] = useState<ManagedPhoneNumberBlockRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const api = useMemo(() => new PhoneManagementApiClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [numList, blockList] = await Promise.all([
      fetchAllNumbers(api),
      fetchAllBlocks(api),
    ]);
    setNumbers(numList);
    setBlocks(blockList);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchData();
    });
    return () => {
      cancelled = true;
    };
  }, [session, fetchData]);

  const overview = useMemo(
    () => computePhoneManagementOverview(numbers, blocks),
    [numbers, blocks]
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[{ label: "Phone Management", href: "/phone-management" }]}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Phone Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage individual phone numbers and number blocks by location.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm" className="gap-2">
                <Link href="/phone-management/numbers/new">
                  <Plus className="w-4 h-4" />
                  Add number
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/phone-management/blocks/new">
                  <Plus className="w-4 h-4" />
                  Add block
                </Link>
              </Button>
            </div>
          </div>

          <PhoneManagementAtGlanceKpis
            atGlance={overview.at_glance}
            loading={loading}
          />

          <PhoneManagementNumbersBreakdown overview={overview} loading={loading} />

          <PhoneManagementQuickLinks />

          <PhoneManagementFeatureCards />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
