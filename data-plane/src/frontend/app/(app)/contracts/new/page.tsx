"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadZone } from "@/components/contracts/file-upload-zone";
import { ContractApiClient } from "@/lib/api-client/contract";
import { parseApiError } from "@/lib/api-client/error-parser";
import {
  validateContractForm,
  hasContractFormErrors,
  type ContractFormErrors,
} from "@/lib/contracts/validation";
import type { ContractCreatePayload } from "@/types/contracts";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const labelClass = "block text-sm font-medium text-gray-900 mb-2";

const defaultPayload: ContractCreatePayload = {
  carrier: "",
  contract_number: "",
  date: null,
  nrc: 0,
  mrc: 0,
  start_date: "",
  end_date: null,
  document: null,
};

export default function NewContractPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ContractCreatePayload>(defaultPayload);
  const [fieldErrors, setFieldErrors] = useState<ContractFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const contractApiClient = useMemo(() => new ContractApiClient(), []);

  /**
   * Updates form state with new values and clears validation errors for those fields.
   * Used so that individual field errors disappear when the user starts correcting them.
   */
  const updateFormFields = useCallback(
    (updates: Partial<ContractCreatePayload>) => {
      // Merge updates into the current form state
      setPayload((prev) => ({ ...prev, ...updates }));
      // Clear any API-level error
      setApiError(null);
      // Remove errors for updated fields
      setFieldErrors((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(updates)) {
          delete next[key as keyof ContractFormErrors];
        }
        return next;
      });
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateContractForm(payload);
    if (hasContractFormErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setApiError(null);
    setSubmitting(true);

    const toSend: ContractCreatePayload = {
      carrier: payload.carrier.trim(),
      contract_number: payload.contract_number.trim(),
      date: payload.date || null,
      nrc: payload.nrc === "" ? 0 : Number(payload.nrc),
      mrc: payload.mrc === "" ? 0 : Number(payload.mrc),
      start_date: payload.start_date,
      end_date: payload.end_date || null,
      document: payload.document ?? undefined,
    };

    const response = await contractApiClient.createContract(toSend);
    setSubmitting(false);

    if (response.error) {
      const parsed = parseApiError(response.errorData);
      setApiError(parsed.message);
      if (parsed.fieldErrors) {
        const mapped: ContractFormErrors = {};
        for (const [k, v] of Object.entries(parsed.fieldErrors)) {
          mapped[k as keyof ContractFormErrors] = v?.[0];
        }
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
      }
      return;
    }

    if (response.data?.id) {
      router.push(`/contracts/${response.data.id}`);
    } else {
      router.push("/contracts/list");
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white px-8 py-4 border-b border-gray-200">
        <div className="text-base text-gray-500">
          <Link href="/contracts" className="text-blue-600 hover:underline">
            Contracts
          </Link>
          <span className="mx-2">&gt;</span>
          <span>New Contract</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Back Button */}
        <Link
          href="/contracts"
          className="inline-flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to overview
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl mb-4">Add New Contract</h1>
          <p className="text-base text-gray-600">
            Fill in the details below to create a new contract
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Basic Information</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className={labelClass}>
                  Carrier / Vendor <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  className={cn(inputClass, fieldErrors.carrier && "border-red-500")}
                  placeholder="e.g. AT&T, Verizon"
                  value={payload.carrier}
                  onChange={(e) => updateFormFields({ carrier: e.target.value })}
                />
                {fieldErrors.carrier && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.carrier}</p>
                )}
              </div>
              <div>
                <Label className={labelClass}>
                  Contract Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  className={cn(inputClass, fieldErrors.contract_number && "border-red-500")}
                  placeholder="Carrier or internal contract ID"
                  value={payload.contract_number}
                  onChange={(e) => updateFormFields({ contract_number: e.target.value })}
                />
                {fieldErrors.contract_number && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.contract_number}</p>
                )}
              </div>
              <div>
                <Label className={labelClass}>Signing / Reference Date</Label>
                <Input
                  type="date"
                  className={inputClass}
                  value={payload.date ?? ""}
                  onChange={(e) =>
                    updateFormFields({ date: e.target.value ? e.target.value : null })
                  }
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Contract Terms</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className={labelClass}>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className={cn(inputClass, fieldErrors.start_date && "border-red-500")}
                  value={payload.start_date}
                  onChange={(e) => updateFormFields({ start_date: e.target.value })}
                />
                {fieldErrors.start_date && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.start_date}</p>
                )}
              </div>
              <div>
                <Label className={labelClass}>End Date</Label>
                <Input
                  type="date"
                  className={cn(inputClass, fieldErrors.end_date && "border-red-500")}
                  value={payload.end_date ?? ""}
                  onChange={(e) =>
                    updateFormFields({ end_date: e.target.value ? e.target.value : null })
                  }
                />
                {fieldErrors.end_date && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.end_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Financial Details</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Label className={labelClass}>NRC (Non-Recurring Charge)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={cn("pl-7", inputClass, fieldErrors.nrc && "border-red-500")}
                    placeholder="0.00"
                    value={payload.nrc === 0 ? "" : payload.nrc}
                    onChange={(e) =>
                      updateFormFields({
                        nrc: e.target.value === "" ? 0 : e.target.value,
                      })
                    }
                  />
                </div>
                {fieldErrors.nrc && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.nrc}</p>
                )}
              </div>
              <div>
                <Label className={labelClass}>MRC (Monthly Recurring Charge)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={cn("pl-7", inputClass, fieldErrors.mrc && "border-red-500")}
                    placeholder="0.00"
                    value={payload.mrc === 0 ? "" : payload.mrc}
                    onChange={(e) =>
                      updateFormFields({
                        mrc: e.target.value === "" ? 0 : e.target.value,
                      })
                    }
                  />
                </div>
                {fieldErrors.mrc && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.mrc}</p>
                )}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl mb-8">Documents</h2>
            <FileUploadZone
              value={payload.document ?? null}
              onChange={(file) => updateFormFields({ document: file ?? null })}
            />
          </div>

          {apiError && (
            <div
              className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
              role="alert"
            >
              {apiError}
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <Link
              href="/contracts"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating…" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
