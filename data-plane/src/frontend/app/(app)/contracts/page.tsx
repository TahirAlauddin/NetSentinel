"use client";

import { Search, SlidersHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";
import type {
  ContractListResponse,
  ContractOverviewResponse,
} from "@/types/contracts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DEFAULT_CONTRACT_OVERVIEW } from "@/lib/contracts/constants";
import { ContractsBreadcrumb } from "@/components/contracts/contracts-breadcrumb";
import { ContractsAtAGlanceKpis } from "@/components/contracts/contracts-at-a-glance-kpis";
import { ContractsSpendingPieChart } from "@/components/contracts/contracts-spending-pie-chart";
import { ContractsTopContractsBarChart } from "@/components/contracts/contracts-top-contracts-bar-chart";
import { ContractsTable } from "@/components/contracts/contracts-table";

export default function ContractsPage() {
  const [data, setData] = useState<ContractListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [overview, setOverview] = useState<ContractOverviewResponse>(
    DEFAULT_CONTRACT_OVERVIEW
  );
  const [overviewLoading, setOverviewLoading] = useState(true);

  const contractApiClient = useMemo(() => new ContractApiClient(), []);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await contractApiClient.getContracts<ContractListResponse>({
      search: search || undefined,
      ordering: "carrier",
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setData(null);
      return;
    }
    if (res.data) {
      if (Array.isArray(res.data)) {
        setData({
          count: res.data.length,
          next: null,
          previous: null,
          results: res.data,
        });
      } else {
        setData(res.data as ContractListResponse);
      }
    } else {
      setData({ count: 0, next: null, previous: null, results: [] });
    }
  }, [search, contractApiClient]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    const res = await contractApiClient.getContractOverview();
    setOverviewLoading(false);
    if (!res.error && res.data)
      setOverview(res.data as ContractOverviewResponse);
  }, [contractApiClient]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchContracts();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchContracts]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchOverview();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleDeleteClick = (id: number) => setDeleteId(id);
  const handleDeleteCancel = () => setDeleteId(null);

  const handleDeleteConfirm = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    const res = await contractApiClient.deleteContract(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    fetchContracts();
    fetchOverview();
  };

  const contracts = data?.results ?? [];
  const total = data?.count ?? 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <ContractsBreadcrumb
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Contracts" },
        ]}
      />

      <div className="p-6 lg:p-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-semibold text-gray-900">
            Contract Management
          </h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-lg text-base flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-5 h-5" />
              Discover
            </button>
            <Link
              href="/contracts/new"
              className="px-6 py-3 bg-red-500 text-white rounded-lg text-base flex items-center gap-3 hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Contract
            </Link>
          </div>
        </div>

        <ContractsAtAGlanceKpis
          atGlance={overview.at_glance}
          loading={overviewLoading}
        />

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Category breakdown
            </h2>
            <button
              type="button"
              className="text-base text-gray-600 flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-12 min-w-0">
            <ContractsSpendingPieChart
              data={overview.spending_by_category}
              totalSpend={overview.total_spend}
              loading={overviewLoading}
            />
            <ContractsTopContractsBarChart data={overview.top_contracts} />
          </div>

          <div className="mt-10">
            <h3 className="text-base text-gray-600 mb-6">
              Contract categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-3">
              {(overviewLoading ? [] : overview.categories).map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between text-base py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-gray-500">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ContractsTable
          contracts={contracts}
          total={total}
          loading={loading}
          error={error}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onDeleteClick={handleDeleteClick}
        />
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The contract will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
