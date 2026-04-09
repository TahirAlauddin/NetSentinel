/**
 * Helpers for RBAC-related component tests.
 * Simulates "user in a group" by setting JWT session `user.permissions` (what the app uses).
 */

import React from "react";
import { render, type RenderResult } from "@testing-library/react";
import { PermissionsProvider } from "@/contexts/permissions-context";
import { RoutePermissionGuard } from "@/components/auth/route-permission-guard";

export type MockSessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      permissions: string[];
      isSuperuser?: boolean;
    };

function buildSessionReturn(state: MockSessionState) {
  if (state.status === "loading") {
    return { data: null, status: "loading" as const, update: jest.fn() };
  }
  if (state.status === "unauthenticated") {
    return { data: null, status: "unauthenticated" as const, update: jest.fn() };
  }
  return {
    data: {
      user: {
        id: "test-user",
        email: "rbac-test@example.com",
        name: "RBAC Test",
        permissions: state.permissions,
        isSuperuser: state.isSuperuser === true,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    },
    status: "authenticated" as const,
    update: jest.fn(),
  };
}

export function renderRouteGuardWithSession(
  state: MockSessionState,
  ui: React.ReactNode,
  useSessionImpl: jest.Mock
): RenderResult {
  useSessionImpl.mockReturnValue(buildSessionReturn(state));
  return render(
    <PermissionsProvider>
      <RoutePermissionGuard>{ui}</RoutePermissionGuard>
    </PermissionsProvider>
  );
}
