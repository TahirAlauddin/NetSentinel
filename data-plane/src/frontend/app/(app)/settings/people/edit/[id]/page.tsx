"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { validateId } from "@/lib/security/input-validation";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditPersonPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const personId = validateId(params.id);

  // TODO:> Fix this
  const [loading, setLoading] = useState(personId !== null);
  // This route is kept for backward compatibility only.
  // It now redirects to the merged details page at `/settings/people/[id]`.

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && !session?.user?.isSuperuser) {
      router.replace("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (personId === null) {
      router.replace("/settings/people");
      return;
    }

    if (personId === null) return;
    router.replace(`/settings/people/${personId}`);
  }, [personId, router]);
  if (personId === null) return null;

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="min-h-[calc(100dvh-120px)]">
            <div className="p-8">
              <SettingsHeader currentPage="Edit Person" />
              <div className="text-sm text-muted-foreground mt-4">Loading...</div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return null;
}

