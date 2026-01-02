/**
 * Tests for app/(app)/assets/page.tsx
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssetsPage from "@/app/(app)/assets/page";
import { listAssets, deleteAsset } from "@/app/(app)/assets/actions/index";
import { useRouter } from "next/navigation";

// Mock dependencies
jest.mock("@/app/(app)/assets/actions/index", () => ({
  listAssets: jest.fn(),
  deleteAsset: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

import { Asset } from "@/types/assets";
import { AssetTableProps } from "@/components/apps/assets/AssetTable";

jest.mock("@/components/apps/assets/AssetTable", () => ({
  AssetTable: ({ assets, onEditClick, onDeleteClick }: AssetTableProps) => (
    <div data-testid="asset-table">
      {assets.map((asset: Asset) => (
        <div key={asset.id} data-testid={`asset-${asset.id}`}>
          {asset.name}
          <button onClick={() => onEditClick(asset)}>Edit</button>
          <button onClick={() => onDeleteClick(asset.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

import { AssetMetrics } from "@/types/assets";

jest.mock("@/components/apps/assets/AssetMetrics", () => ({
  AssetMetricsDisplay: ({ metrics }: { metrics: AssetMetrics }) => (
    <div data-testid="asset-metrics">{JSON.stringify(metrics)}</div>
  ),
}));

jest.mock("@/components/apps/assets/AssetChart", () => ({
  AssetChart: () => <div data-testid="asset-chart">Chart</div>,
}));

// Mock window.confirm
global.confirm = jest.fn(() => true);

describe("AssetsPage", () => {
  const mockListAssets = listAssets as jest.MockedFunction<typeof listAssets>;
  const mockDeleteAsset = deleteAsset as jest.MockedFunction<typeof deleteAsset>;
  const mockRouterPush = jest.fn();
  const mockUseRouter = jest.mocked(useRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm = jest.fn(() => true);
    mockUseRouter.mockReturnValue({
      push: mockRouterPush,
    } as ReturnType<typeof useRouter>);
  });

  it("should render loading state initially", () => {
    mockListAssets.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AssetsPage />);
    expect(screen.getByText("Loading assets...")).toBeInTheDocument();
  });

  it("should render assets after loading", async () => {
    const mockAssets = [
      { id: 1, name: "Asset 1", status: "active" },
      { id: 2, name: "Asset 2", status: "retired" },
    ];

    mockListAssets.mockResolvedValue(mockAssets);

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("asset-table")).toBeInTheDocument();
    });

    expect(screen.getByText("Asset 1")).toBeInTheDocument();
    expect(screen.getByText("Asset 2")).toBeInTheDocument();
  });

  it("should render error message on load failure", async () => {
    // Suppress expected console.error from component
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    mockListAssets.mockRejectedValue(new Error("Failed to load"));

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it("should navigate to new asset page when create button clicked", async () => {
    mockListAssets.mockResolvedValue([]);

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("Managed Asset")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Managed Asset");
    await act(async () => {
      await userEvent.click(createButton);
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/assets/new");
  });

  it("should handle asset deletion", async () => {
    const mockAssets = [{ id: 1, name: "Asset 1", status: "active" }];
    mockListAssets.mockResolvedValue(mockAssets);
    mockDeleteAsset.mockResolvedValue({ success: true });

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("Asset 1")).toBeInTheDocument();
    });

    const deleteButton = screen.getByText("Delete");
    await act(async () => {
      await userEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(mockDeleteAsset).toHaveBeenCalledWith(1);
    });
  });

  it("should not delete asset if user cancels", async () => {
    const mockAssets = [{ id: 1, name: "Asset 1", status: "active" }];
    mockListAssets.mockResolvedValue(mockAssets);
    global.confirm = jest.fn(() => false);

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("Asset 1")).toBeInTheDocument();
    });

    const deleteButton = screen.getByText("Delete");
    await act(async () => {
      await userEvent.click(deleteButton);
    });

    expect(mockDeleteAsset).not.toHaveBeenCalled();
  });

  it("should display error on delete failure", async () => {
    const mockAssets = [{ id: 1, name: "Asset 1", status: "active" }];
    mockListAssets.mockResolvedValue(mockAssets);
    mockDeleteAsset.mockResolvedValue({
      success: false,
      error: "Delete failed",
    });

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByText("Asset 1")).toBeInTheDocument();
    });

    const deleteButton = screen.getByText("Delete");
    await act(async () => {
      await userEvent.click(deleteButton);
    });

    // Wait for error message to appear
    await waitFor(
      () => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify deleteAsset was called
    expect(mockDeleteAsset).toHaveBeenCalledWith(1);
  });

  it("should render metrics and chart", async () => {
    mockListAssets.mockResolvedValue([]);

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("asset-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("asset-chart")).toBeInTheDocument();
    });
  });
});

