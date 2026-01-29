import { ProtectedRoute } from "@/components/feedback/protected-route";

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
