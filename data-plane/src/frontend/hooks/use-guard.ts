"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/contexts/permissions-context";

export function useGuard(permission?: string) {
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();

  const isLoading = status === "loading";
  const isAllowed = status === "authenticated" && (!permission || can(permission));

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      router.replace("/login");
      return;
    }


    if (permission && !can(permission)) {
      router.replace("/unauthorized");
    }
  }, [status, permission, can, router]);

  return { isLoading, isAllowed };
}
