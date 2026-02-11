"use client";

import { useEffect, useState } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";

export interface ContractCategoryOption {
  id: number;
  name: string;
}

/**
 * Fetches contract categories (id, name) for dropdowns. Used on new and edit contract pages.
 */
export function useContractCategories(): {
  categories: ContractCategoryOption[];
  loading: boolean;
} {
  const [categories, setCategories] = useState<ContractCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const client = new ContractApiClient();
    client.getContractCategories().then((res) => {
      if (cancelled || res.error || !res.data) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCategories(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}
