"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { Customer, IPAddress, Subnet } from "@/types/ipam";
import { listAssets } from "@/app/(app)/assets/actions";

export type IpSearchMode = "basic" | "range" | "hostname";

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

const SEARCH_HISTORY_KEY = "ipam_search_history";
const MAX_HISTORY_ITEMS = 10;

const ipamApi = new IpamApiClient();

export interface UseIpSearchEnhancedResult {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  subnetFilter: string;
  setSubnetFilter: (value: string) => void;
  customerFilter: string;
  setCustomerFilter: (value: string) => void;
  assetFilter: string;
  setAssetFilter: (value: string) => void;
  rangeStart: string;
  setRangeStart: (value: string) => void;
  rangeEnd: string;
  setRangeEnd: (value: string) => void;
  hostnameQuery: string;
  setHostnameQuery: (value: string) => void;
  searchMode: IpSearchMode;
  setSearchMode: (mode: IpSearchMode) => void;
  results: IPAddress[];
  loading: boolean;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  searchHistory: SearchHistoryItem[];
  hasActiveFilters: boolean;
  subnets: Subnet[];
  customers: Customer[];
  assets: Array<{ id: number; name: string }>;
  handleSearch: () => void;
  handleClear: () => void;
  handleHistoryClick: (item: SearchHistoryItem) => void;
}

/**
 * Enhanced IP search hook for IPAM.
 * Handles filter option loading, multiple search modes, and local search history.
 */
export function useIpSearchEnhanced(): UseIpSearchEnhancedResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [subnetFilter, setSubnetFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [assetFilter, setAssetFilter] = useState<string>("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [hostnameQuery, setHostnameQuery] = useState("");
  const [results, setResults] = useState<IPAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<IpSearchMode>("basic");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [subnetsRes, customersRes, assetsRes] = await Promise.all([
          ipamApi.getSubnets(),
          ipamApi.getCustomers(),
          listAssets(),
        ]);

        if (subnetsRes.data) {
          setSubnets(extractIpamArrayData<Subnet>(subnetsRes.data));
        }
        if (customersRes.data) {
          setCustomers(extractIpamArrayData<Customer>(customersRes.data));
        }
        if (assetsRes) {
          setAssets(assetsRes.map((a) => ({ id: a.id, name: a.name })));
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error loading IP search filter options:", error);
        }
      }
    };

    const loadSearchHistory = () => {
      try {
        const stored = typeof window !== "undefined"
          ? window.localStorage.getItem(SEARCH_HISTORY_KEY)
          : null;
        if (stored) {
          setSearchHistory(JSON.parse(stored) as SearchHistoryItem[]);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error loading IP search history:", error);
        }
      }
    };

    void loadFilterOptions();
    loadSearchHistory();
  }, []);

  const saveToHistory = (query: string, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
    };

    const updated = [
      newItem,
      ...searchHistory.filter((item) => item.query !== query),
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(updated);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error saving IP search history:", error);
      }
    }
  };

  // Split into smaller helpers to keep complexity reasonable.
  const buildBasicSearchParams = (): Record<string, unknown> => {
    const params: Record<string, unknown> = {};
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) params.q = trimmedQuery;
    if (statusFilter) params.status = statusFilter;
    if (subnetFilter) params.subnet = subnetFilter;
    if (customerFilter) params.customer = customerFilter;
    if (assetFilter) params.assigned_to_asset = assetFilter;

    return params;
  };

  const hasBasicSearchCriteria = (): boolean => {
    const hasQuery = !!searchQuery.trim();
    const hasFilters =
      !!statusFilter || !!subnetFilter || !!customerFilter || !!assetFilter;

    return hasQuery || hasFilters;
  };

  const handleBasicSearch = async () => {
    if (!hasBasicSearchCriteria()) {
      toast.error("Please enter a search query or select at least one filter");
      return;
    }

    setLoading(true);
    try {
      const params = buildBasicSearchParams();
      const response = await ipamApi.searchIPAddresses(params);
      if (response.error) {
        throw new Error(response.error);
      }

      const resultData = Array.isArray(response.data) ? response.data : [];
      setResults(resultData);

      if (searchQuery.trim()) {
        saveToHistory(searchQuery.trim(), resultData.length);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error searching IPs:", error);
      }
      toast.error(error instanceof Error ? error.message : "Failed to search IP addresses");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeSearch = async () => {
    if (!rangeStart.trim() || !rangeEnd.trim()) {
      toast.error("Please enter both start and end IP addresses");
      return;
    }

    setLoading(true);
    try {
      const subnetId = subnetFilter ? parseInt(subnetFilter, 10) : undefined;
      const response = await ipamApi.searchIPRange(rangeStart.trim(), rangeEnd.trim(), subnetId);

      if (response.error) {
        throw new Error(response.error);
      }

      const resultData = Array.isArray(response.data) ? response.data : [];
      setResults(resultData);
      saveToHistory(`${rangeStart} - ${rangeEnd}`, resultData.length);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error searching IP range:", error);
      }
      toast.error(error instanceof Error ? error.message : "Failed to search IP range");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHostnameSearch = async () => {
    if (!hostnameQuery.trim()) {
      toast.error("Please enter a hostname");
      return;
    }

    setLoading(true);
    try {
      const response = await ipamApi.searchByHostname(hostnameQuery.trim());

      if (response.error) {
        throw new Error(response.error);
      }

      const resultData = Array.isArray(response.data) ? response.data : [];
      setResults(resultData);
      saveToHistory(hostnameQuery.trim(), resultData.length);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error searching by hostname:", error);
      }
      toast.error(error instanceof Error ? error.message : "Failed to search by hostname");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchMode === "range") {
      void handleRangeSearch();
    } else if (searchMode === "hostname") {
      void handleHostnameSearch();
    } else {
      void handleBasicSearch();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSubnetFilter("");
    setCustomerFilter("");
    setAssetFilter("");
    setRangeStart("");
    setRangeEnd("");
    setHostnameQuery("");
    setResults([]);
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setSearchMode("basic");
    setTimeout(() => {
      void handleBasicSearch();
    }, 100);
  };

  const hasActiveFilters =
    !!searchQuery ||
    !!statusFilter ||
    !!subnetFilter ||
    !!customerFilter ||
    !!assetFilter ||
    !!rangeStart ||
    !!rangeEnd ||
    !!hostnameQuery;

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    subnetFilter,
    setSubnetFilter,
    customerFilter,
    setCustomerFilter,
    assetFilter,
    setAssetFilter,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    hostnameQuery,
    setHostnameQuery,
    searchMode,
    setSearchMode,
    results,
    loading,
    showFilters,
    setShowFilters,
    searchHistory,
    hasActiveFilters,
    subnets,
    customers,
    assets,
    handleSearch,
    handleClear,
    handleHistoryClick,
  };
}

