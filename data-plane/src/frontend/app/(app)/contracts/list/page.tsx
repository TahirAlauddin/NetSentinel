"use client";

import { Search, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";
import type { Contract, ContractListResponse } from "@/types/contracts";
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

/** Format currency for display */
function formatCurrency(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

/** First two chars of carrier for avatar */
function initials(carrier: string): string {
  const parts = carrier.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return carrier.slice(0, 2).toUpperCase() || "—";
}

export default function ContractListPage() {
  const [data, setData] = useState<ContractListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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
  };

  const contracts = data?.results ?? [];
  const total = data?.count ?? 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">
          <Link href="/contracts" className="text-blue-600 hover:underline">
            Contracts
          </Link>
          <span className="mx-2">&gt;</span>
          <span>All</span>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-5xl mb-4">Contract Management</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base">Contracts</span>
              <span className="text-sm text-gray-400">
                {loading ? "…" : `(Showing ${contracts.length} of ${total})`}
              </span>
            </div>
            <Link
              href="/contracts/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add contract
            </Link>
          </div>

          <div className="bg-gray-100 p-6 border-b border-gray-200">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by carrier or contract number"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
          </div>

          {error && (
            <div className="p-6 border-b border-gray-200 bg-red-50 text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading contracts…</div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No contracts found.{" "}
              <Link href="/contracts/new" className="text-blue-600 hover:underline">
                Add a contract
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 p-8">
              {contracts.map((contract: Contract) => (
                <div
                  key={contract.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white text-lg flex-shrink-0">
                      {initials(contract.carrier)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="block font-medium text-gray-900 mb-2 truncate hover:text-blue-600"
                      >
                        {contract.carrier} – {contract.contract_number}
                      </Link>
                      <div className="text-sm text-gray-500 mb-3">
                        {contract.start_date}
                        {contract.end_date ? ` – ${contract.end_date}` : ""}
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
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The contract will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
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
