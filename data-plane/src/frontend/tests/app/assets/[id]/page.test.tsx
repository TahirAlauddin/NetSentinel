/**
 * Tests for app/(app)/assets/[id]/page.tsx
 */

import { screen, waitFor } from "@testing-library/react";
import { render } from "@/tests/__utils__/test-utils";
import { useSession } from "next-auth/react";
import AssetDetailPage from "@/app/(app)/assets/[id]/page";
import { AssetsApiClient } from "@/lib/api-client/asset";
import { useParams } from "next/navigation";

// Mock dependencies
jest.mock("@/lib/api-client/asset", () => ({
  AssetsApiClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ id: "1" })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

jest.mock("@/components/apps/assets/AssetDetail", () => ({
  AssetDetail: ({ assetId }: { assetId: number }) => (
    <div data-testid="asset-detail">Asset Detail {assetId}</div>
  ),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe("AssetDetailPage", () => {
  let mockGetAsset: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          permissions: ["assets.view_asset"],
          isSuperuser: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);
    mockGetAsset = jest.fn();
    (AssetsApiClient as jest.MockedClass<typeof AssetsApiClient>).mockImplementation(
      () =>
        ({
          getAsset: mockGetAsset,
        } as unknown as InstanceType<typeof AssetsApiClient>)
    );
  });

  it("should render loading state initially", () => {
    mockGetAsset.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AssetDetailPage />);
    expect(screen.getByText("Loading asset data...")).toBeInTheDocument();
  });

  it("should render asset detail after loading", async () => {
    const mockAsset = { id: 1, name: "Test Asset" };
    mockGetAsset.mockResolvedValue({
      data: mockAsset,
      error: null,
      status: 200,
    });

    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId("asset-detail")).toBeInTheDocument();
    });

    expect(screen.getByText("Asset Detail 1")).toBeInTheDocument();
  });

  it("should render error message on load failure", async () => {
    // Suppress expected console.error from component
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    mockGetAsset.mockResolvedValue({
      data: null,
      error: "Asset not found",
      status: 404,
    });

    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Asset not found")).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it("should render error when asset data is null", async () => {
    // Suppress expected console.error from component
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    mockGetAsset.mockResolvedValue({
      data: null,
      error: null,
      status: 200,
    });

    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Asset not found")).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it("should handle API error", async () => {
    // Suppress expected console.error from component
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    mockGetAsset.mockRejectedValue(new Error("Network error"));

    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it("should handle invalid asset ID", async () => {
    jest.mocked(useParams).mockReturnValue({ id: undefined });

    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Invalid asset ID. Please use a valid link or go back to the list.")).toBeInTheDocument();
    });
  });
});

