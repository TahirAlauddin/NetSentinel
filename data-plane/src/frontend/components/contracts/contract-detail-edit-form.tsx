"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadZone } from "@/components/contracts/file-upload-zone";
import { LogoUploadZone } from "@/components/contracts/logo-upload-zone";
import {
  CONTRACT_INPUT_CLASS,
  CONTRACT_LABEL_CLASS,
} from "@/lib/contracts/constants";
import {
  type ContractFormErrors,
} from "@/lib/contracts/validation";
import type { ContractUpdatePayload } from "@/types/contracts";
import { cn } from "@/lib/utils";

interface ContractCategory {
  id: number;
  name: string;
}

interface ContractDetailEditFormProps {
  payload: ContractUpdatePayload;
  fieldErrors: ContractFormErrors;
  apiError: string | null;
  saving: boolean;
  categories: ContractCategory[];
  logoPreviewUrl: string | null;
  /** When set, a Cancel link is shown next to Save that navigates to this href. */
  cancelHref?: string;
  onUpdate: (updates: Partial<ContractUpdatePayload>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ContractDetailEditForm({
  payload,
  fieldErrors,
  apiError,
  saving,
  categories,
  logoPreviewUrl,
  cancelHref,
  onUpdate,
  onSubmit,
}: ContractDetailEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl mb-8">Edit Contract</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Carrier</Label>
            <Input
              type="text"
              className={cn(
                CONTRACT_INPUT_CLASS,
                fieldErrors.carrier && "border-red-500"
              )}
              value={payload.carrier ?? ""}
              onChange={(e) => onUpdate({ carrier: e.target.value })}
            />
            {fieldErrors.carrier && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.carrier}</p>
            )}
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Contract Number</Label>
            <Input
              type="text"
              className={cn(
                CONTRACT_INPUT_CLASS,
                fieldErrors.contract_number && "border-red-500"
              )}
              value={payload.contract_number ?? ""}
              onChange={(e) => onUpdate({ contract_number: e.target.value })}
            />
            {fieldErrors.contract_number && (
              <p className="text-sm text-red-600 mt-1">
                {fieldErrors.contract_number}
              </p>
            )}
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Signing Date</Label>
            <Input
              type="date"
              className={CONTRACT_INPUT_CLASS}
              value={payload.date ?? ""}
              onChange={(e) =>
                onUpdate({ date: e.target.value || null })
              }
            />
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Category</Label>
            <select
              className={CONTRACT_INPUT_CLASS}
              value={payload.category ?? ""}
              onChange={(e) =>
                onUpdate({
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
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Contract Type</Label>
            <select
              className={CONTRACT_INPUT_CLASS}
              value={payload.contract_type ?? "fixed_term"}
              onChange={(e) => {
                const val = e.target.value as "fixed_term" | "monthly";
                onUpdate({
                  contract_type: val,
                  ...(val === "monthly" ? { end_date: null } : {}),
                });
              }}
            >
              <option value="fixed_term">Fixed Term</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Start Date</Label>
            <Input
              type="date"
              className={cn(
                CONTRACT_INPUT_CLASS,
                fieldErrors.start_date && "border-red-500"
              )}
              value={payload.start_date ?? ""}
              onChange={(e) => onUpdate({ start_date: e.target.value })}
            />
            {fieldErrors.start_date && (
              <p className="text-sm text-red-600 mt-1">
                {fieldErrors.start_date}
              </p>
            )}
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>
              End Date{" "}
              {(payload.contract_type ?? "fixed_term") === "fixed_term" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Input
              type="date"
              className={cn(
                CONTRACT_INPUT_CLASS,
                fieldErrors.end_date && "border-red-500"
              )}
              value={payload.end_date ?? ""}
              onChange={(e) =>
                onUpdate({
                  end_date: e.target.value ? e.target.value : null,
                })
              }
              disabled={
                (payload.contract_type ?? "fixed_term") === "monthly"
              }
            />
            {fieldErrors.end_date && (
              <p className="text-sm text-red-600 mt-1">
                {fieldErrors.end_date}
              </p>
            )}
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>NRC ($)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className={cn(
                CONTRACT_INPUT_CLASS,
                fieldErrors.nrc && "border-red-500"
              )}
              value={payload.nrc ?? ""}
              onChange={(e) =>
                onUpdate({
                  nrc: e.target.value === "" ? "" : e.target.value,
                })
              }
            />
            {fieldErrors.nrc && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.nrc}</p>
            )}
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>MRC ($)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className={cn(
                CONTRACT_INPUT_CLASS,
                fieldErrors.mrc && "border-red-500"
              )}
              value={payload.mrc ?? ""}
              onChange={(e) =>
                onUpdate({
                  mrc: e.target.value === "" ? "" : e.target.value,
                })
              }
            />
            {fieldErrors.mrc && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.mrc}</p>
            )}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>Logo (optional)</Label>
            <LogoUploadZone
              value={payload.logo ?? null}
              previewUrl={logoPreviewUrl}
              onChange={(file) => onUpdate({ logo: file ?? null })}
            />
          </div>
          <div>
            <Label className={CONTRACT_LABEL_CLASS}>
              Replace document (optional)
            </Label>
            <FileUploadZone
              value={payload.document ?? null}
              onChange={(file) => onUpdate({ document: file ?? null })}
            />
          </div>
        </div>
      </div>
      {apiError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {apiError}
        </div>
      )}
      <div className="flex justify-end gap-3">
        {cancelHref && (
          <Link
            href={cancelHref}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
