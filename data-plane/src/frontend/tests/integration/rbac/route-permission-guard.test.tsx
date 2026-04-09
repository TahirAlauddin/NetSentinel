/**
 * Integration-style tests for app-shell RBAC (RoutePermissionGuard).
 *
 * Backend "group → permissions" is represented here as session.user.permissions (JWT),
 * which is what PermissionsProvider and guards use in production.
 */

import React from "react";
import { waitFor, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { renderRouteGuardWithSession } from "@/tests/__utils__/rbac-test-utils";

const mockUseSession = useSession as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe("RoutePermissionGuard (RBAC)", () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    });
  });

  it("shows loading spinner while session is loading", () => {
    mockUsePathname.mockReturnValue("/assets");
    renderRouteGuardWithSession({ status: "loading" }, <div>Protected</div>, mockUseSession);
    expect(screen.getByText("Loading session…")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", async () => {
    mockUsePathname.mockReturnValue("/assets");
    renderRouteGuardWithSession({ status: "unauthenticated" }, <div>Protected</div>, mockUseSession);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("allows access when route has no mapped permission", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    renderRouteGuardWithSession(
      { status: "authenticated", permissions: [] },
      <div data-testid="content">Dashboard</div>,
      mockUseSession
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("allows superuser even without explicit permission strings", () => {
    mockUsePathname.mockReturnValue("/ipam/subnets");
    renderRouteGuardWithSession(
      { status: "authenticated", permissions: [], isSuperuser: true },
      <div data-testid="content">IPAM</div>,
      mockUseSession
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalledWith("/unauthorized");
  });

  describe.each([
    {
      pathname: "/assets",
      permission: "assets.view_asset",
      label: "assets overview",
    },
    {
      pathname: "/ipam/subnets",
      permission: "ipam.view_subnet",
      label: "ipam subnets",
    },
    {
      pathname: "/settings/groups",
      permission: "users.view_group",
      label: "settings groups",
    },
    {
      pathname: "/contracts",
      permission: "contracts.view_contract",
      label: "contracts",
    },
  ])("$label ($pathname)", ({ pathname, permission }) => {
    it("renders protected content when session includes required permission", () => {
      mockUsePathname.mockReturnValue(pathname);
      renderRouteGuardWithSession(
        { status: "authenticated", permissions: [permission] },
        <div data-testid="protected">Allowed</div>,
        mockUseSession
      );
      expect(screen.getByTestId("protected")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalledWith("/unauthorized");
    });

    it("redirects to /unauthorized when permission is missing", async () => {
      mockUsePathname.mockReturnValue(pathname);
      renderRouteGuardWithSession(
        { status: "authenticated", permissions: ["some.other.permission"] },
        <div data-testid="protected">Allowed</div>,
        mockUseSession
      );
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/unauthorized");
      });
      expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    });
  });
});
