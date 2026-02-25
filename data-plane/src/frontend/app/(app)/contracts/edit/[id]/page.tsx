"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";
import { getContractApiError } from "@/lib/contracts/api-errors";
import {
  validateContractForm,
  hasContractFormErrors,
  clearContractFieldErrors,
  type ContractFormErrors,
} from "@/lib/contracts/validation";
import { normalizeContractUpdatePayload } from "@/lib/contracts/utils";
import type { Contract, ContractUpdatePayload } from "@/types/contracts";
import { useContractCategories } from "@/hooks/use-contract-categories";
import { ContractsBreadcrumb } from "@/components/apps/contracts/contracts-breadcrumb";
import { ContractDetailEditForm } from "@/components/apps/contracts/contract-detail-edit-form";

export default function ContractEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editPayload, setEditPayload] = useState<ContractUpdatePayload>({});
  const [fieldErrors, setFieldErrors] = useState<ContractFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoUrlRef = useRef<string | null>(null);
  const { categories } = useContractCategories();
  const contractApiClient = useMemo(() => new ContractApiClient(), []);

  const fetchContract = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await contractApiClient.getContract(id);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setContract(null);
      return;
    }
    if (res.data) {
      const c = res.data;
      setContract(c);
      setEditPayload({
        carrier: c.carrier,
        contract_number: c.contract_number,
        contract_type: c.contract_type ?? "fixed_term",
        date: c.date ?? null,
        nrc: c.nrc,
        mrc: c.mrc,
        start_date: c.start_date,
        end_date: c.end_date ?? null,
        document: null,
        logo: null,
        category: c.category ?? undefined,
      });
    }
  }, [id, contractApiClient]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void fetchContract();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchContract]);

  useEffect(() => {
    if (!contract?.logo || !id) {
      if (logoUrlRef.current) {
        URL.revokeObjectURL(logoUrlRef.current);
        logoUrlRef.current = null;
        queueMicrotask(() => setLogoUrl(null));
      }
      return;
    }
    let cancelled = false;
    contractApiClient.getContractLogo(id).then((res) => {
      if (cancelled || res.error || !res.url) return;
      if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
      logoUrlRef.current = res.url;
      queueMicrotask(() => setLogoUrl(res.url ?? null));
    });
    return () => {
      cancelled = true;
      if (logoUrlRef.current) {
        URL.revokeObjectURL(logoUrlRef.current);
        logoUrlRef.current = null;
        queueMicrotask(() => setLogoUrl(null));
      }
    };
  }, [contract?.logo, id, contractApiClient]);

  const updateEdit = (updates: Partial<ContractUpdatePayload>) => {
    setEditPayload((prev) => ({ ...prev, ...updates }));
    setApiError(null);
    setFieldErrors((prev) =>
      clearContractFieldErrors(prev, Object.keys(updates))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateContractForm(editPayload);
    if (hasContractFormErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setApiError(null);
    setSaving(true);

    const toSend = normalizeContractUpdatePayload(editPayload);
    const res = await contractApiClient.updateContract(id, toSend);
    setSaving(false);

    if (res.error) {
      const { message, fieldErrors: nextErrors } = getContractApiError(res);
      setApiError(message);
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    if (res.data) setContract(res.data);
    router.push(`/contracts/${id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="text-gray-500">Loading contract…</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error ?? "Contract not found"}
        </div>
        <Link
          href="/contracts"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to contracts
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <ContractsBreadcrumb
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Contracts", href: "/contracts" },
          {
            label: `${contract.carrier} – ${contract.contract_number}`,
            href: `/contracts/${id}`,
          },
          { label: "Edit" },
        ]}
      />

      <div className="p-6 lg:p-8">
        <Link
          href={`/contracts/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to contract
        </Link>

        <ContractDetailEditForm
          payload={editPayload}
          fieldErrors={fieldErrors}
          apiError={apiError}
          saving={saving}
          categories={categories}
          logoPreviewUrl={logoUrl}
          cancelHref={`/contracts/${id}`}
          onUpdate={updateEdit}
          onSubmit={handleSave}
        />
      </div>
    </div>
  );
}
