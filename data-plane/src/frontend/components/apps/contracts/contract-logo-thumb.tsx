"use client";

import { useEffect, useState, useRef } from "react";
import { ContractApiClient } from "@/lib/api-client/contract";

function initials(carrier: string): string {
  const parts = carrier.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return carrier.slice(0, 2).toUpperCase() || "—";
}

export function ContractLogoThumb({
  contractId,
  carrier,
  hasLogo,
  className = "w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0",
}: {
  contractId: number | string;
  carrier: string;
  hasLogo: boolean;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<string | null>(null);
  const api = useRef(new ContractApiClient());

  useEffect(() => {
    if (!hasLogo) return;
    let cancelled = false;
    api.current.getContractLogo(contractId).then((res) => {
      if (cancelled || res.error || !res.url) return;
      if (ref.current) URL.revokeObjectURL(ref.current);
      ref.current = res.url;
      setUrl(res.url);
    });
    return () => {
      cancelled = true;
      if (ref.current) {
        URL.revokeObjectURL(ref.current);
        ref.current = null;
        setUrl(null);
      }
    };
  }, [contractId, hasLogo]);

  if (url) {
    return (
      <div className={className + " overflow-hidden bg-gray-100"}>
        <img src={url} alt="" className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className={className + " bg-blue-600"}>{initials(carrier)}</div>
  );
}
