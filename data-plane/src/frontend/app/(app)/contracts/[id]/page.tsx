"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Pencil, Download, ExternalLink } from "lucide-react";
import { ContractsBreadcrumb } from "@/components/contracts/contracts-breadcrumb";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadZone } from "@/components/contracts/file-upload-zone";
import { LogoUploadZone } from "@/components/contracts/logo-upload-zone";
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
import {
  formatContractCurrency,
  contractCarrierInitials,
  contractDocumentUrl,
  normalizeContractUpdatePayload,
} from "@/lib/contracts/utils";
import type { Contract, ContractUpdatePayload } from "@/types/contracts";
import { apiConfig } from "@/lib/config";
import { useContractCategories } from "@/hooks/use-contract-categories";
import { cn } from "@/lib/utils";
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

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPayload, setEditPayload] = useState<ContractUpdatePayload>({});
  const [fieldErrors, setFieldErrors] = useState<ContractFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
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
    if (res.data) setContract(res.data);
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

  // Load logo as blob URL when contract has logo (revoke on unmount or when contract changes)
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

  const startEdit = () => {
    if (!contract) return;
    setEditPayload({
      carrier: contract.carrier,
      contract_number: contract.contract_number,
      date: contract.date ?? null,
      nrc: contract.nrc,
      mrc: contract.mrc,
      start_date: contract.start_date,
      end_date: contract.end_date ?? null,
      document: null,
      logo: null,
      category: contract.category ?? undefined,
    });
    setFieldErrors({});
    setApiError(null);
    setEditing(true);
  };

  const updateEdit = (updates: Partial<ContractUpdatePayload>) => {
    setEditPayload((prev) => ({ ...prev, ...updates }));
    setApiError(null);
    setFieldErrors((prev) => clearContractFieldErrors(prev, Object.keys(updates)));
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
    setEditing(false);
  };

  const handleDownloadDocument = useCallback(async () => {
    if (!contract?.document) return;
    setDocumentLoading(true);
    const res = await contractApiClient.getContractDocument(id);
    setDocumentLoading(false);
    if (res.error || !res.data) {
      setError(res.error ?? "Failed to load document");
      return;
    }
    const blob = res.data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename ?? "contract-document";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [id, contract?.document, contractApiClient]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const res = await contractApiClient.deleteContract(id);
    setDeleting(false);
    setDeleteOpen(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/contracts");
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
        <Link href="/contracts" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to contracts
        </Link>
      </div>
    );
  }

  const docUrl = contractDocumentUrl(contract.document, apiConfig.clientBaseUrl);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <ContractsBreadcrumb
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Contracts", href: "/contracts" },
          {
            label: editing
              ? `Edit: ${contract.carrier} – ${contract.contract_number}`
              : `${contract.carrier} – ${contract.contract_number}`,
          },
        ]}
      />

      <div className="p-6 lg:p-8">
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
            {!editing ? (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl mb-8">Edit Contract</h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>Carrier</Label>
                  <Input
                    type="text"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.carrier && "border-red-500")}
                    value={editPayload.carrier ?? ""}
                    onChange={(e) => updateEdit({ carrier: e.target.value })}
                  />
                  {fieldErrors.carrier && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.carrier}</p>
                  )}
                </div>
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>Contract Number</Label>
                  <Input
                    type="text"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.contract_number && "border-red-500")}
                    value={editPayload.contract_number ?? ""}
                    onChange={(e) => updateEdit({ contract_number: e.target.value })}
                  />
                  {fieldErrors.contract_number && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.contract_number}</p>
                  )}
                </div>
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>Signing Date</Label>
                  <Input
                    type="date"
                    className={CONTRACT_INPUT_CLASS}
                    value={editPayload.date ?? ""}
                    onChange={(e) =>
                      updateEdit({ date: e.target.value || null })
                    }
                  />
                </div>
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>Category</Label>
                  <select
                    className={CONTRACT_INPUT_CLASS}
                    value={editPayload.category ?? ""}
                    onChange={(e) =>
                      updateEdit({
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
                  <Label className={CONTRACT_LABEL_CLASS}>Start Date</Label>
                  <Input
                    type="date"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.start_date && "border-red-500")}
                    value={editPayload.start_date ?? ""}
                    onChange={(e) => updateEdit({ start_date: e.target.value })}
                  />
                  {fieldErrors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.start_date}</p>
                  )}
                </div>
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>End Date</Label>
                  <Input
                    type="date"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.end_date && "border-red-500")}
                    value={editPayload.end_date ?? ""}
                    onChange={(e) =>
                      updateEdit({ end_date: e.target.value || null })
                    }
                  />
                  {fieldErrors.end_date && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.end_date}</p>
                  )}
                </div>
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>NRC ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.nrc && "border-red-500")}
                    value={editPayload.nrc ?? ""}
                    onChange={(e) =>
                      updateEdit({ nrc: e.target.value === "" ? "" : e.target.value })
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
                    className={cn(CONTRACT_INPUT_CLASS, fieldErrors.mrc && "border-red-500")}
                    value={editPayload.mrc ?? ""}
                    onChange={(e) =>
                      updateEdit({ mrc: e.target.value === "" ? "" : e.target.value })
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
                    value={editPayload.logo ?? null}
                    previewUrl={logoUrl}
                    onChange={(file) => updateEdit({ logo: file ?? null })}
                  />
                </div>
                <div>
                  <Label className={CONTRACT_LABEL_CLASS}>Replace document (optional)</Label>
                  <FileUploadZone
                    value={editPayload.document ?? null}
                    onChange={(file) => updateEdit({ document: file ?? null })}
                  />
                </div>
              </div>
            </div>
            {apiError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {apiError}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl mb-8">Contract Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="text-sm text-gray-600 mb-1">NRC</div>
                  <div className="text-xl font-semibold">{formatContractCurrency(contract.nrc)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">MRC</div>
                  <div className="text-xl font-semibold">{formatContractCurrency(contract.mrc)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Start date</div>
                  <div className="text-base text-gray-900">{contract.start_date}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">End date</div>
                  <div className="text-base text-gray-900">{contract.end_date ?? "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Signing / reference date</div>
                  <div className="text-base text-gray-900">{contract.date ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Document</div>
                  {contract.document ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {docUrl && (
                        <a
                          href={docUrl}
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
                        onClick={handleDownloadDocument}
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
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-sm text-gray-500">
                Created {contract.created_at} · Updated {contract.updated_at}
              </div>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this contract. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
