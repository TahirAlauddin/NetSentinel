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
  usePathname: jest.fn(() => "/assets"),
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
      expect(screen.getByTestId("asset-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("asset-chart")).toBeInTheDocument();
    });

    // Metrics mock renders JSON; page shows metrics for loaded assets (total: 2)
    expect(screen.getByTestId("asset-metrics")).toHaveTextContent(/"total":2/);
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

  it("should render metrics and chart", async () => {
    mockListAssets.mockResolvedValue([]);

    render(<AssetsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("asset-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("asset-chart")).toBeInTheDocument();
    });
  });
});

