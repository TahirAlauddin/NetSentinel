/**
 * Tests for app/(app)/assets/[id]/page.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import AssetDetailPage from "@/app/(app)/assets/[id]/page";
import { AssetsApiClient } from "@/lib/api-client/asset";

// Mock dependencies
jest.mock("@/lib/api-client/asset", () => ({
  AssetsApiClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
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
    mockGetAsset = jest.fn();
    (AssetsApiClient as jest.MockedClass<typeof AssetsApiClient>).mockImplementation(
      () =>
        ({
          getAsset: mockGetAsset,
        } as any)
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
    const useParamsMock = jest.fn(() => ({ id: undefined }));
    jest.spyOn(require("next/navigation"), "useParams").mockImplementation(useParamsMock);

    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Asset ID is required")).toBeInTheDocument();
    });
  });
});

