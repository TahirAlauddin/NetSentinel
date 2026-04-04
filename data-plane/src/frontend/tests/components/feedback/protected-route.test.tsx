import { screen, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { render } from "@/tests/__utils__/test-utils";
import { ProtectedRoute } from "@/components/feedback/protected-route";

describe("ProtectedRoute", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    } as ReturnType<typeof useRouter>);
  });

  it("shows loading while session resolves", () => {
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    render(
      <ProtectedRoute>
        <div>Child</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Loading auth state...")).toBeInTheDocument();
  });

  it("pushes /login when unauthenticated", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    render(
      <ProtectedRoute>
        <div>Child</div>
      </ProtectedRoute>
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("pushes /login on RefreshAccessTokenError", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "1", email: "a@b.com" },
        error: "RefreshAccessTokenError",
        expires: "",
      },
      status: "authenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(
      <ProtectedRoute>
        <div>Child</div>
      </ProtectedRoute>
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("pushes /unauthorized when requiredRole admin and user is not staff", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "a@b.com",
          isStaff: false,
          permissions: [],
          isSuperuser: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin only</div>
      </ProtectedRoute>
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/unauthorized"));
  });

  it("renders children when requiredPermission is granted", async () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "a@b.com",
          permissions: ["ipam.view_subnet"],
          isSuperuser: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    render(
      <ProtectedRoute requiredPermission="ipam.view_subnet">
        <div data-testid="ok">OK</div>
      </ProtectedRoute>
    );
    await waitFor(() => expect(screen.getByTestId("ok")).toBeInTheDocument());
  });
});
