import { screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { render } from "@/tests/__utils__/test-utils";
import { Can } from "@/contexts/permissions-context";

describe("Can (permissions context)", () => {
  beforeEach(() => {
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
  });

  it("renders children when user has permission", () => {
    render(
      <Can permission="assets.view_asset">
        <span data-testid="yes">yes</span>
      </Can>
    );
    expect(screen.getByTestId("yes")).toBeInTheDocument();
  });

  it("renders fallback when user lacks permission", () => {
    render(
      <Can permission="ipam.view_subnet" fallback={<span data-testid="no">no</span>}>
        <span data-testid="yes">yes</span>
      </Can>
    );
    expect(screen.getByTestId("no")).toBeInTheDocument();
    expect(screen.queryByTestId("yes")).not.toBeInTheDocument();
  });

  it("renders children for superuser without explicit permission", () => {
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "a@b.com",
          name: "U",
          permissions: [],
          isSuperuser: true,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    render(
      <Can permission="anything.view_foo">
        <span data-testid="yes">yes</span>
      </Can>
    );
    expect(screen.getByTestId("yes")).toBeInTheDocument();
  });
});
