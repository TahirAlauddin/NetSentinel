"use client";

import { Search, SlidersHorizontal, Plus, Trash2 } from "lucide-react";
import { ContractsBreadcrumb } from "@/components/contracts/contracts-breadcrumb";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";
import { ContractLogoThumb } from "@/components/contracts/contract-logo-thumb";
import type {
  Contract,
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

const AT_GLANCE_LABELS: Array<{
  key: keyof ContractOverviewResponse["at_glance"];
  label: string;
  color: string;
}> = [
  { key: "total", label: "Total", color: "text-gray-900" },
  { key: "active", label: "Active", color: "text-green-600" },
  { key: "expired", label: "Expired", color: "text-gray-400" },
  { key: "expiring_30", label: "Expiring < 30 days", color: "text-gray-400" },
  { key: "expiring_60", label: "Expiring < 60 days", color: "text-blue-600" },
  { key: "expiring_90", label: "Expiring < 90 days", color: "text-blue-600" },
  { key: "monthly", label: "Monthly", color: "text-gray-400" },
];

function formatCurrency(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

const defaultOverview: ContractOverviewResponse = {
  at_glance: {
    total: 0,
    active: 0,
    expired: 0,
    expiring_30: 0,
    expiring_60: 0,
    expiring_90: 0,
    monthly: 0,
  },
  spending_by_category: [],
  top_contracts: [],
  categories: [],
  total_spend: 0,
};

export default function ContractsPage() {
  const [data, setData] = useState<ContractListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [overview, setOverview] = useState<ContractOverviewResponse>(defaultOverview);
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
    if (!res.error && res.data) setOverview(res.data as ContractOverviewResponse);
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-base flex items-center gap-3 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Contract
            </Link>
          </div>
        </div>

        {/* At a glance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            At a glance
          </h2>
          {overviewLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
              {AT_GLANCE_LABELS.map(({ label }) => (
                <div
                  key={label}
                  className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse"
                >
                  <div className="text-base text-gray-400 mb-2">{label}</div>
                  <div className="text-4xl text-gray-300">—</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
              {AT_GLANCE_LABELS.map(({ key, label, color }) => (
                <div
                  key={key}
                  className="bg-white rounded-lg p-6 border border-gray-200"
                >
                  <div className="text-base text-gray-600 mb-2">{label}</div>
                  <div className={`text-4xl ${color}`}>
                    {overview.at_glance[key]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
            <div className="min-w-0">
              <h3 className="text-base text-gray-600 mb-6">
                Spending by category
              </h3>
              <div
                className="relative flex items-center justify-center"
                style={{ height: 350 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.spending_by_category}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {overview.spending_by_category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                  aria-hidden
                >
                  <div className="text-3xl font-semibold text-gray-900">
                    {overviewLoading
                      ? "—"
                      : formatCurrency(overview.total_spend)}
                  </div>
                  <div className="text-base text-gray-600 mt-1">
                    Contracts Spend (annual)
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 min-h-[360px]">
              <h3 className="text-base text-gray-600 mb-6">
                Top 5 active contracts
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={overview.top_contracts}
                  margin={{ top: 8, right: 16, left: 12, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    horizontal
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="value"
                    type="number"
                    label={{
                      value: "Total value (USD)",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fontSize: 11 },
                    }}
                    domain={[
                      0,
                      (() => {
                        const vals = overview.top_contracts.map((c) => c.value);
                        const max = vals.length ? Math.max(...vals) : 1;
                        return max * 1.1;
                      })(),
                    ]}
                    tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={false}
                    width={80}
                    tickMargin={8}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `$${Number(value).toLocaleString()}`
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  >
                    {overview.top_contracts.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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

        {/* Contracts list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-base font-medium">Contracts</span>
              <span className="text-sm text-gray-400">
                {loading ? "…" : `(Showing ${contracts.length} of ${total})`}
              </span>
            </div>
            <Link
              href="/contracts/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add contract
            </Link>
          </div>

          <div className="bg-gray-100 p-6 border-b border-gray-200">
            <form onSubmit={handleSearchSubmit} className="relative flex rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden />
              <input
                type="text"
                placeholder="Search by carrier or contract number"
                className="flex-1 pl-12 pr-2 py-3 text-base focus:outline-none min-w-0"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search contracts by carrier or contract number"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
              >
                <Search className="w-4 h-4" aria-hidden />
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="p-6 border-b border-gray-200 bg-red-50 text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading contracts…
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No contracts found.{" "}
              <Link
                href="/contracts/new"
                className="text-blue-600 hover:underline"
              >
                Add a contract
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {contracts.map((contract: Contract) => (
                <div
                  key={contract.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <ContractLogoThumb
                      contractId={contract.id}
                      carrier={contract.carrier}
                      hasLogo={Boolean(contract.logo)}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="block font-medium text-gray-900 mb-2 truncate hover:text-blue-600"
                      >
                        {contract.carrier} – {contract.contract_number}
                      </Link>
                      <div className="text-sm text-gray-500 mb-3">
                        {contract.start_date}
                        {contract.end_date
                          ? ` – ${contract.end_date}`
                          : ""}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">MRC</div>
                        <div className="text-base font-semibold text-gray-900">
                          {formatCurrency(contract.mrc)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(contract.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label={`Delete ${contract.contract_number}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
