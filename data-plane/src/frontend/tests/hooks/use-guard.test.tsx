import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGuard } from "@/hooks/use-guard";
import { render as renderWithProviders } from "@/tests/__utils__/test-utils";

function GuardProbe({ permission }: { permission?: string }) {
  const { isLoading, isAllowed } = useGuard(permission);
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="allowed">{String(isAllowed)}</span>
    </div>
  );
}

describe("useGuard", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    } as ReturnType<typeof useRouter>);
  });

  it("does not redirect while session is loading", () => {
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    renderWithProviders(<GuardProbe permission="assets.view_asset" />);
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to /login when unauthenticated", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    renderWithProviders(<GuardProbe permission="assets.view_asset" />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to /unauthorized when permission is required and missing", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "a@b.com",
          name: "U",
          permissions: ["other.permission"],
          isSuperuser: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    renderWithProviders(<GuardProbe permission="assets.view_asset" />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/unauthorized");
    });
  });

  it("allows when permission is granted", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "a@b.com",
          name: "U",
          permissions: ["assets.view_asset"],
          isSuperuser: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    renderWithProviders(<GuardProbe permission="assets.view_asset" />);
    await waitFor(() => {
      expect(screen.getByTestId("allowed")).toHaveTextContent("true");
    });
    expect(mockReplace).not.toHaveBeenCalledWith("/unauthorized");
  });

  it("allows when no permission argument (guard only auth)", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "a@b.com",
          name: "U",
          permissions: [],
          isSuperuser: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    renderWithProviders(<GuardProbe />);
    await waitFor(() => {
      expect(screen.getByTestId("allowed")).toHaveTextContent("true");
    });
  });
});
