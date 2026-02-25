"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadZone } from "@/components/apps/contracts/file-upload-zone";
import { ContractLogoPreview } from "@/components/apps/contracts/contract-logo-preview";
import { ContractsBreadcrumb } from "@/components/apps/contracts/contracts-breadcrumb";
import { ContractApiClient } from "@/lib/api-client/contract";
import {
  CONTRACT_INPUT_CLASS,
  CONTRACT_LABEL_CLASS,
} from "@/lib/contracts/constants";
import { getContractApiError } from "@/lib/contracts/api-errors";
import {
  validateContractForm,
  hasContractFormErrors,
  clearContractFieldErrors,
  type ContractFormErrors,
} from "@/lib/contracts/validation";
import { normalizeContractCreatePayload } from "@/lib/contracts/utils";
import type { ContractCreatePayload } from "@/types/contracts";
import { useContractCategories } from "@/hooks/use-contract-categories";
import { cn } from "@/lib/utils";

const defaultPayload: ContractCreatePayload = {
  carrier: "",
  contract_number: "",
  contract_type: "fixed_term",
  date: null,
  nrc: 0,
  mrc: 0,
  start_date: "",
  end_date: null,
  document: null,
  logo: null,
  category: null,
};

export default function NewContractPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ContractCreatePayload>(defaultPayload);
  const [fieldErrors, setFieldErrors] = useState<ContractFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { categories } = useContractCategories();
  const contractApiClient = useMemo(() => new ContractApiClient(), []);

  const updateFormFields = useCallback(
    (updates: Partial<ContractCreatePayload>) => {
      setPayload((prev) => ({ ...prev, ...updates }));
      setApiError(null);
      setFieldErrors((prev) => clearContractFieldErrors(prev, Object.keys(updates)));
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

    const toSend = normalizeContractCreatePayload(payload);
    const response = await contractApiClient.createContract(toSend);
    setSubmitting(false);

    if (response.error) {
      const { message, fieldErrors: nextErrors } = getContractApiError(response);
      setApiError(message);
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    if (response.data?.id) {
      router.push(`/contracts/${response.data.id}`);
    } else {
      router.push("/contracts");
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <ContractsBreadcrumb
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Contracts", href: "/contracts" },
          { label: "New Contract" },
        ]}
      />

      {/* Main Content */}
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            Add New Contract
          </h1>
          <p className="text-base text-gray-600">
            Fill in the details below to create a new contract
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Logo preview on top */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center">
            <ContractLogoPreview
              value={payload.logo ?? null}
              onChange={(file) => updateFormFields({ logo: file ?? null })}
            />
          </div>

          {/* Basic info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>
                  Carrier / Vendor <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  className={cn(CONTRACT_INPUT_CLASS, fieldErrors.carrier && "border-red-500")}
                  placeholder="e.g. AT&T, Verizon"
                  value={payload.carrier}
                  onChange={(e) => updateFormFields({ carrier: e.target.value })}
                />
                {fieldErrors.carrier && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.carrier}</p>
                )}
              </div>
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>
                  Contract Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  className={cn(CONTRACT_INPUT_CLASS, fieldErrors.contract_number && "border-red-500")}
                  placeholder="Carrier or internal contract ID"
                  value={payload.contract_number}
                  onChange={(e) => updateFormFields({ contract_number: e.target.value })}
                />
                {fieldErrors.contract_number && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.contract_number}</p>
                )}
              </div>
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>Signing / Reference Date</Label>
                <Input
                  type="date"
                  className={CONTRACT_INPUT_CLASS}
                  value={payload.date ?? ""}
                  onChange={(e) =>
                    updateFormFields({ date: e.target.value ? e.target.value : null })
                  }
                />
              </div>
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>Category</Label>
                <select
                  className={CONTRACT_INPUT_CLASS}
                  value={payload.category ?? ""}
                  onChange={(e) =>
                    updateFormFields({
                      category: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Contract Terms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>
                  Contract Type <span className="text-red-500">*</span>
                </Label>
                <select
                  className={CONTRACT_INPUT_CLASS}
                  value={payload.contract_type ?? "fixed_term"}
                  onChange={(e) =>
                    updateFormFields({
                      contract_type: e.target.value as "fixed_term" | "monthly",
                      ...(e.target.value === "monthly" ? { end_date: null } : {}),
                    })
                  }
                >
                  <option value="fixed_term">Fixed Term</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className={cn(CONTRACT_INPUT_CLASS, fieldErrors.start_date && "border-red-500")}
                  value={payload.start_date}
                  onChange={(e) => updateFormFields({ start_date: e.target.value })}
                />
                {fieldErrors.start_date && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.start_date}</p>
                )}
              </div>
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>
                  End Date {(payload.contract_type ?? "fixed_term") === "fixed_term" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  className={cn(CONTRACT_INPUT_CLASS, fieldErrors.end_date && "border-red-500")}
                  value={payload.end_date ?? ""}
                  onChange={(e) =>
                    updateFormFields({ end_date: e.target.value ? e.target.value : null })
                  }
                  disabled={(payload.contract_type ?? "fixed_term") === "monthly"}
                />
                {fieldErrors.end_date && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.end_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Financial Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className={CONTRACT_LABEL_CLASS}>NRC (Non-Recurring Charge)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.nrc && "border-red-500", "pl-6")}
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
                <Label className={CONTRACT_LABEL_CLASS}>MRC (Monthly Recurring Charge)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.mrc && "border-red-500", "pl-6")}
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

          {/* Documents - same as before */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Documents
            </h2>
            <Label className={CONTRACT_LABEL_CLASS}>Contract document</Label>
            <FileUploadZone
              value={payload.document ?? null}
              onChange={(file) => updateFormFields({ document: file ?? null })}
            />
          </div>

          {apiError && (
            <div
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
              role="alert"
            >
              {apiError}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
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
