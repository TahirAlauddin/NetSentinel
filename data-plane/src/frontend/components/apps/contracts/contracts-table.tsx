"use client";

import { Search, Plus, Trash2, Pencil, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ContractLogoThumb } from "@/components/apps/contracts/contract-logo-thumb";
import type { Contract } from "@/types/contracts";
import { formatContractCurrency } from "@/lib/contracts/utils";

interface ContractsTableProps {
  contracts: Contract[];
  total: number;
  loading: boolean;
  error: string | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onDeleteClick: (id: number) => void;
}

export function ContractsTable({
  contracts,
  total,
  loading,
  error,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onDeleteClick,
}: ContractsTableProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(e);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium">Contracts</span>
          <span className="text-sm text-gray-400">
            {loading ? "…" : `(Showing ${contracts.length} of ${total})`}
          </span>
          <div
            className="flex rounded-lg border border-gray-600 overflow-hidden"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-red-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Link
          href="/contracts/new"
          className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add contract
        </Link>
      </div>

      <div className="bg-gray-100 p-6 border-b border-gray-200">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500"
        >
          <Search
            className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search by carrier or contract number"
            className="flex-1 pl-12 pr-2 py-3 text-base focus:outline-none min-w-0"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            aria-label="Search contracts by carrier or contract number"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shrink-0"
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
          <Link href="/contracts/new" className="text-red-600 hover:underline">
            Add a contract
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
          {contracts.map((contract: Contract) => (
            <div
              key={contract.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <ContractLogoThumb
                contractId={contract.id}
                carrier={contract.carrier}
                hasLogo={Boolean(contract.logo)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden bg-gray-300"
              />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="block font-medium text-gray-900 text-sm truncate hover:text-red-600"
                >
                  {contract.carrier} – {contract.contract_number}
                </Link>
                {contract.category_name && (
                  <div className="text-xs text-gray-500 truncate">
                    • {contract.category_name}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {contract.total_cost != null
                      ? formatContractCurrency(contract.total_cost)
                      : "Ongoing"}
                  </span>
                  {contract.expiry_label && (
                    <span
                      className={
                        contract.expiry_status === "expired"
                          ? "rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800"
                          : "rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800"
                      }
                    >
                      {contract.expiry_label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/contracts/edit/${contract.id}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  aria-label={`Edit ${contract.contract_number}`}
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => onDeleteClick(contract.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  aria-label={`Delete ${contract.contract_number}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-2.5 text-sm font-medium text-gray-500 bg-gray-50">
            <span className="w-10" />
            <span>Name</span>
            <span>Category</span>
            <span>Type</span>
            <span className="text-right">Total Cost</span>
            <span className="text-right">Status</span>
            <span className="w-14" />
          </div>
          {contracts.map((contract: Contract) => (
            <div
              key={contract.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-2.5 items-center hover:bg-gray-50 transition-colors"
            >
              <ContractLogoThumb
                contractId={contract.id}
                carrier={contract.carrier}
                hasLogo={Boolean(contract.logo)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden bg-gray-100"
              />
              <Link
                href={`/contracts/${contract.id}`}
                className="font-medium text-gray-900 truncate hover:text-red-600"
              >
                {contract.carrier} – {contract.contract_number}
              </Link>
              <span className="text-sm text-gray-600 truncate">
                {contract.category_name ?? "—"}
              </span>
              <span className="text-sm text-gray-600">
                {contract.contract_type_display ??
                  contract.contract_type ??
                  "Fixed Term"}
              </span>
              <span className="text-right font-semibold text-gray-900">
                {contract.total_cost != null
                  ? formatContractCurrency(contract.total_cost)
                  : "Ongoing"}
              </span>
              <div className="text-right">
                {contract.expiry_label ? (
                  <span
                    className={
                      contract.expiry_status === "expired"
                        ? "rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800"
                        : "rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800"
                    }
                  >
                    {contract.expiry_label}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/contracts/edit/${contract.id}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  aria-label={`Edit ${contract.contract_number}`}
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => onDeleteClick(contract.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
  );
}
