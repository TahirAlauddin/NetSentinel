"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";
import { contractDocumentUrl } from "@/lib/contracts/utils";
import type { Contract } from "@/types/contracts";
import { apiConfig } from "@/lib/config";
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
import { ContractsBreadcrumb } from "@/components/contracts/contracts-breadcrumb";
import { ContractDetailHeader } from "@/components/contracts/contract-detail-header";
import { ContractDetailInfo } from "@/components/contracts/contract-detail-info";
import { ContractDetailMeta } from "@/components/contracts/contract-detail-meta";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoUrlRef = useRef<string | null>(null);
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
        <Link
          href="/contracts"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to contracts
        </Link>
      </div>
    );
  }

  const docUrl = contractDocumentUrl(
    contract.document,
    apiConfig.clientBaseUrl
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <ContractsBreadcrumb
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Contracts", href: "/contracts" },
          {
            label: `${contract.carrier} – ${contract.contract_number}`,
          },
        ]}
      />

      <div className="p-6 lg:p-8">
        <ContractDetailHeader
          contract={contract}
          logoUrl={logoUrl}
          editHref={`/contracts/edit/${id}`}
          onDeleteClick={() => setDeleteOpen(true)}
        />

        <ContractDetailInfo
          contract={contract}
          documentUrl={docUrl}
          documentLoading={documentLoading}
          onDownloadDocument={handleDownloadDocument}
        />
        <ContractDetailMeta
          createdAt={contract.created_at}
          updatedAt={contract.updated_at}
        />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this contract. This action cannot be
              undone.
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
