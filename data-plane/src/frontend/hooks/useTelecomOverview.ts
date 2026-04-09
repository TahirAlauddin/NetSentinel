"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { TelecomApiClient } from "@/lib/api-client/telecom";
import { computeTelecomKpis } from "@/lib/api-client/telecom-helpers";
import type { ProviderRecord } from "@/types/providers";
import type { ServiceRecord } from "@/types/services";

interface TelecomOverviewState {
  providers: ProviderRecord[];
  services: ServiceRecord[];
  loading: boolean;
  kpis: ReturnType<typeof computeTelecomKpis>;
}

const EMPTY_KPIS = computeTelecomKpis([], []);

function normalizeResult<T>(
  data: T[] | { results: T[] } | null | undefined
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray((data as { results: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export function useTelecomOverview(): TelecomOverviewState {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const api = new TelecomApiClient();
        const [providersRes, servicesRes] = await Promise.all([
          api.getProviders<ProviderRecord[] | { results: ProviderRecord[] }>(),
          api.getServices<ServiceRecord[] | { results: ServiceRecord[] }>(),
        ]);

        if (cancelled) return;

        const providersData = normalizeResult(providersRes.data);
        const servicesData = normalizeResult(servicesRes.data);

        setProviders(providersData);
        setServices(servicesData);
      } catch (_e) {
        if (!cancelled) {
          setProviders([]);
          setServices([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const kpis = useMemo(
    () => computeTelecomKpis(providers, services),
    [providers, services]
  );

  return {
    providers,
    services,
    loading,
    kpis: providers.length === 0 && services.length === 0 ? EMPTY_KPIS : kpis,
  };
}

