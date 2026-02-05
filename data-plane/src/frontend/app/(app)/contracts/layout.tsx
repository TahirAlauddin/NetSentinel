import { ProtectedRoute } from "@/components/feedback/protected-route";
import { AppShell } from "@/components/layout/app-shell";

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
