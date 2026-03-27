"use client";

import { ProtectedRoute } from "@/components/feedback/protected-route";

export default function PhoneManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
