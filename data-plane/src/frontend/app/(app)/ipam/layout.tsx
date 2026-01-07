import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { IpamSidebar } from "@/components/ipam/ipam-sidebar";

export default function IpamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
          <IpamSidebar />
          <div className="flex-1 p-8">
            {children}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

