"use client";

import { Download, ExternalLink } from "lucide-react";
import { formatContractCurrency } from "@/lib/contracts/utils";
import type { Contract } from "@/types/contracts";

interface ContractDetailInfoProps {
  contract: Contract;
  documentUrl: string | null;
  documentLoading: boolean;
  onDownloadDocument: () => void;
}

export function ContractDetailInfo({
  contract,
  documentUrl,
  documentLoading,
  onDownloadDocument,
}: ContractDetailInfoProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
      <h2 className="text-2xl mb-8">Contract Information</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="text-sm text-gray-600 mb-1">Contract type</div>
          <div className="text-base text-gray-900">
            {contract.contract_type_display ??
              (contract.contract_type === "monthly"
                ? "Monthly"
                : "Fixed Term")}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Total cost</div>
          <div className="text-xl font-semibold">
            {contract.total_cost != null
              ? formatContractCurrency(contract.total_cost)
              : "Ongoing"}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">NRC</div>
          <div className="text-xl font-semibold">
            {formatContractCurrency(contract.nrc)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">MRC</div>
          <div className="text-xl font-semibold">
            {formatContractCurrency(contract.mrc)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Start date</div>
          <div className="text-base text-gray-900">{contract.start_date}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">End date</div>
          <div className="text-base text-gray-900">
            {contract.end_date ??
              (contract.contract_type === "monthly" ? "Ongoing" : "—")}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="text-sm text-gray-600 mb-1">
            Signing / reference date
          </div>
          <div className="text-base text-gray-900">
            {contract.date ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Document</div>
          {contract.document ? (
            <div className="flex flex-wrap items-center gap-3">
              {documentUrl && (
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View in new tab
                </a>
              )}
              <button
                type="button"
                onClick={onDownloadDocument}
                disabled={documentLoading}
                className="inline-flex items-center gap-2 text-blue-600 hover:underline disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {documentLoading ? "Downloading…" : "Download"}
              </button>
            </div>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
