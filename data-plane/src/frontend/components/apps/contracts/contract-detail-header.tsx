"use client";

import Link from "next/link";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { contractCarrierInitials } from "@/lib/contracts/utils";
import type { Contract } from "@/types/contracts";

interface ContractDetailHeaderProps {
  contract: Contract;
  logoUrl: string | null;
  /** When set, Edit is rendered as a link to this href (e.g. /contracts/edit/123). */
  editHref?: string;
  onDeleteClick: () => void;
}

export function ContractDetailHeader({
  contract,
  logoUrl,
  editHref,
  onDeleteClick,
}: ContractDetailHeaderProps) {
  return (
    <>
      <Link
        href="/contracts"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all contracts
      </Link>

      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center text-3xl text-gray-600 shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            ) : (
              contractCarrierInitials(contract.carrier)
            )}
          </div>
          <div>
            <h1 className="text-5xl mb-2">
              {contract.carrier} – {contract.contract_number}
            </h1>
            <div className="text-base text-gray-600">
              {contract.start_date}
              {contract.end_date ? ` – ${contract.end_date}` : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editHref && (
            <Link
              href={editHref}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
          <button
            type="button"
            onClick={onDeleteClick}
            className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
